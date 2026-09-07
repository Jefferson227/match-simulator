#!/usr/bin/env node
/**
 * Health-check for wiki/.
 *
 * Five passes, per wiki/CLAUDE.md:
 *   asserts     every `asserts` entry still holds against the codebase
 *   links       every [[wikilink]] resolves
 *   orphans     every page is reachable from index.md
 *   staleness   pages whose `verified` date has aged past --stale-days
 *   drift       commits since the wiki last moved, so hand-made changes get looked at
 *
 * Failures (asserts, links) exit 1. Warnings (orphans, staleness, drift) exit 0 —
 * they need a human to judge, not a build to break.
 *
 * Usage: node scripts/lint-wiki.cjs [--stale-days N] [--quiet]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const WIKI = path.join(ROOT, 'wiki');
// Entry points: nothing is expected to link to these.
const LINK_ROOTS = new Set(['index', 'log', 'CLAUDE']);
// Navigation and manifest files: they carry no frontmatter by design.
const STRUCTURAL = new Set(['index', 'log', 'CLAUDE', 'sources']);

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const STALE_DAYS = Number(args[args.indexOf('--stale-days') + 1]) || 240;

const failures = [];
const warnings = [];
const fail = (page, msg) => failures.push({ page, msg });
const warn = (page, msg) => warnings.push({ page, msg });

/* ------------------------------------------------------------------ parsing */

/**
 * Frontmatter parser for the subset wiki/CLAUDE.md allows: scalars, inline
 * arrays, and a list of flat maps under `asserts`. Deliberately not a YAML
 * implementation — it throws on anything it does not recognise rather than
 * guessing, so a malformed page is reported instead of silently skipped.
 */
function parseFrontmatter(text, page) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) {
    fail(page, 'frontmatter opened with --- but never closed');
    return null;
  }

  const out = {};
  let list = null; // the array currently being filled
  let item = null; // the map currently being filled

  for (const raw of text.slice(4, end).split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;

    const listItem = raw.match(/^ {2}- (\w+):\s*(.*)$/);
    const listCont = raw.match(/^ {4}(\w+):\s*(.*)$/);
    const topLevel = raw.match(/^(\w+):\s*(.*)$/);

    if (listItem && list) {
      item = { [listItem[1]]: coerce(listItem[2]) };
      list.push(item);
    } else if (listCont && item) {
      item[listCont[1]] = coerce(listCont[2]);
    } else if (topLevel) {
      const [, key, value] = topLevel;
      item = null;
      if (value === '') {
        list = [];
        out[key] = list;
      } else {
        list = null;
        out[key] = coerce(value);
      }
    } else {
      fail(page, `unparseable frontmatter line: ${JSON.stringify(raw)}`);
    }
  }
  return out;
}

function coerce(value) {
  const v = value.trim();
  if (v === '') return '';
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === '[]') return [];
  if (v.startsWith('[') && v.endsWith(']')) {
    return v
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v.replace(/^["']|["']$/g, '');
}

/* ------------------------------------------------------------------ asserts */

const jsonCache = new Map();
function loadJson(file) {
  if (!jsonCache.has(file)) {
    jsonCache.set(file, JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')));
  }
  return jsonCache.get(file);
}

/** Resolve a dotted path, with `.length` working on arrays and strings. */
function resolvePath(value, dotted) {
  for (const key of dotted.split('.')) {
    if (value == null) return undefined;
    value = value[key];
  }
  return value;
}

/** `select: field=value` picks one element out of a top-level JSON array. */
function selectRecord(data, select, page) {
  const eq = select.indexOf('=');
  if (eq === -1) {
    fail(page, `select must look like field=value, got ${JSON.stringify(select)}`);
    return undefined;
  }
  const field = select.slice(0, eq);
  const wanted = select.slice(eq + 1);
  if (!Array.isArray(data)) {
    fail(page, `select used on ${typeof data}, but only a top-level JSON array supports it`);
    return undefined;
  }
  const hit = data.find((record) => String(record[field]) === wanted);
  if (hit === undefined) fail(page, `no record where ${select}`);
  return hit;
}

function checkAssert(a, page) {
  if (!a.file) return fail(page, `assert has no file: ${JSON.stringify(a)}`);
  const abs = path.join(ROOT, a.file);

  if (!fs.existsSync(abs)) return fail(page, `${a.file} does not exist`);
  // `exists: true` is the whole assertion — nothing further to read.
  if (a.exists !== undefined) {
    if (a.exists !== true) fail(page, `exists: must be true, got ${a.exists}`);
    return;
  }

  if (!a.file.endsWith('.json')) {
    return fail(page, `${a.file} is not JSON, so only \`exists: true\` can be asserted on it`);
  }

  let data;
  try {
    data = loadJson(a.file);
  } catch (err) {
    return fail(page, `${a.file} is not valid JSON: ${err.message}`);
  }

  const record = a.select ? selectRecord(data, a.select, page) : data;
  if (record === undefined) return;
  const where = a.select ? `${a.file} [${a.select}]` : a.file;

  if (a.absent !== undefined) {
    if (record[a.absent] !== undefined) {
      fail(page, `${where} → ${a.absent} should be absent, found ${JSON.stringify(record[a.absent])}`);
    }
    return;
  }

  if (a.path === undefined || a.equals === undefined) {
    return fail(page, `assert needs path+equals, absent, or exists: ${JSON.stringify(a)}`);
  }

  const actual = resolvePath(record, a.path);
  if (actual === undefined) {
    fail(page, `${where} → ${a.path} is missing`);
  } else if (String(actual) !== String(a.equals)) {
    fail(page, `${where} → ${a.path} is ${JSON.stringify(actual)}, expected ${JSON.stringify(a.equals)}`);
  }
}

/* -------------------------------------------------------------------- drift */

function driftReport() {
  const log = path.join(WIKI, 'log.md');
  if (!fs.existsSync(log)) return warn('log.md', 'missing — no drift watermark to check against');

  // The watermark is the most recent `sha <hash>` recorded in the log.
  const shas = [...fs.readFileSync(log, 'utf8').matchAll(/\bsha ([0-9a-f]{7,40})\b/g)];
  if (!shas.length) {
    return warn('log.md', 'no `sha <hash>` watermark found — add one to the newest entry');
  }
  const sha = shas[shas.length - 1][1];

  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

  let since;
  try {
    since = git(['log', '--format=%h %s', `${sha}..HEAD`]);
  } catch {
    return warn('log.md', `watermark ${sha} is not a commit in this repository`);
  }
  if (!since) return;

  // A commit that already touched wiki/ was made with the wiki in mind, so it is
  // not unfiled residue. This keeps the watermark from flagging the very commit
  // that moved the wiki. Caveat: a commit touching both code and wiki is treated
  // as filed, even if only part of it was.
  const aware = new Set(
    git(['log', '--format=%h', `${sha}..HEAD`, '--', 'wiki'])
      .split('\n')
      .filter(Boolean)
  );
  const unfiled = since.split('\n').filter((line) => !aware.has(line.split(' ')[0]));
  if (!unfiled.length) return;

  warn(
    'log.md',
    `${unfiled.length} commit(s) since the wiki last moved (${sha}) did not touch wiki/ — ` +
      `check whether any produced durable residue:\n` +
      unfiled.map((l) => `        ${l}`).join('\n')
  );
}

/* --------------------------------------------------------------------- main */

function main() {
  if (!fs.existsSync(WIKI)) {
    console.error('no wiki/ folder at the repository root — nothing to lint');
    process.exit(0);
  }

  const files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.md')) files.push(full);
    }
  })(WIKI);

  const pages = new Map(); // stem -> { rel, body, meta }
  for (const full of files) {
    const rel = path.relative(ROOT, full);
    const text = fs.readFileSync(full, 'utf8');
    const stem = path.basename(full, '.md');
    if (pages.has(stem)) fail(rel, `duplicate page name — also ${pages.get(stem).rel}`);
    pages.set(stem, { rel, text, meta: parseFrontmatter(text, rel) });
  }

  const inbound = new Map([...pages.keys()].map((k) => [k, 0]));

  for (const [stem, page] of pages) {
    const { rel, text, meta } = page;

    // Strip fenced code and inline spans so documentation of the link syntax
    // is not mistaken for a link.
    const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    for (const [, target] of prose.matchAll(/\[\[([^\]]+)\]\]/g)) {
      if (!pages.has(target)) fail(rel, `broken link [[${target}]]`);
      else inbound.set(target, inbound.get(target) + 1);
    }

    if (!meta) {
      if (!STRUCTURAL.has(stem)) warn(rel, 'no frontmatter');
      continue;
    }
    for (const key of ['title', 'type']) {
      if (!meta[key]) warn(rel, `frontmatter is missing \`${key}\``);
    }

    if (Array.isArray(meta.asserts)) {
      for (const a of meta.asserts) checkAssert(a, rel);
    } else if (meta.asserts !== undefined) {
      fail(rel, 'asserts must be a list');
    }

    if (meta.verified) {
      const age = (Date.now() - Date.parse(meta.verified)) / 86400000;
      if (Number.isNaN(age)) warn(rel, `verified is not a date: ${meta.verified}`);
      else if (age > STALE_DAYS) {
        warn(rel, `verified ${meta.verified} — ${Math.round(age)} days old, re-check against raw/`);
      }
    }
  }

  for (const [stem, count] of inbound) {
    if (count === 0 && !LINK_ROOTS.has(stem)) {
      warn(pages.get(stem).rel, 'orphan — nothing links to it');
    }
  }

  driftReport();

  const show = (label, list) => {
    if (!list.length) return;
    console.log(`\n${label}`);
    for (const { page, msg } of list) console.log(`  ${page}\n      ${msg}`);
  };

  if (!QUIET || failures.length) {
    console.log(`wiki lint — ${pages.size} pages`);
    show('FAIL', failures);
    show('WARN', warnings);
    if (!failures.length && !warnings.length) console.log('\nclean');
    console.log(`\n${failures.length} failure(s), ${warnings.length} warning(s)`);
  }

  process.exit(failures.length ? 1 : 0);
}

main();
