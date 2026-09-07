# Wiki schema

This folder is the project's knowledge base. It replaces the old `docs/` folder.

It exists because some knowledge this project depends on **cannot be derived by reading the
repository**: the real rules of Brazilian football competitions, the reasoning behind past design
decisions, and the specs the code is meant to satisfy. Everything else stays where it belongs — in
the code, the seed JSON, and git history.

## The one rule

> **If a fact can be answered by reading the repo, it does not get a page. It gets an `asserts`
> entry instead.**

A page describing what `GameEngine.reduce` does is a copy that rots. A page describing what REC A1
Art. 26 says is knowledge the repo does not contain.

## Layers

| Layer | Folder | Who writes it |
|---|---|---|
| Raw sources | `raw/` | Nobody edits. Fetched, then immutable. |
| Evidence & synthesis | `competitions/`, `concepts/` | Claude, from `raw/` |
| Specs | `specs/` | The user owns; Claude drafts and keeps in sync |
| Decisions | `decisions/` | Claude, at ticket close-out |
| Navigation | `index.md`, `log.md` | Claude, every write |

`raw/` is the source of truth for evidence pages. Never edit a file in `raw/`; if a source changes,
fetch the new version alongside the old and note the supersession in `log.md`.

## Frontmatter

Every page carries YAML frontmatter:

```yaml
---
title: Brasileirão Feminino Série A1
type: competition          # competition | concept | spec | decision
verified: 2026-09-05       # date the facts were last checked against raw/
sources: [rec-a1-2026]     # ids from raw/sources.md; omit for decision pages
asserts:                   # machine-checkable claims; see below
  - file: src/infrastructure/data/championships.json
    select: internalName=brasileirao-feminino-serie-a1
    path: numberOfTeams
    equals: 18
---
```

`asserts` is what keeps the wiki honest. Each entry is a claim the page makes about the codebase that
a lint pass can verify mechanically. When the code changes and an assert fails, either the code
regressed or the page is stale — the lint pass says which pages to look at, and a human decides.

`asserts` supports exactly three forms, checked by `scripts/lint-wiki.cjs`:

```yaml
# 1. a value in a JSON file equals a literal.
#    `select` picks one record out of a top-level array; `path` may be dotted
#    and understands `.length`.
- file: src/infrastructure/data/championships.json
  select: internalName=brasileirao-feminino-serie-a3
  path: phases.length
  equals: 5

# 2. a field is absent — for recording that a rule genuinely does not exist
- file: src/infrastructure/data/championships.json
  select: internalName=brasileirao-feminino-serie-a3
  absent: numberOfRelegatableTeams

# 3. a file exists — the only assertion available against non-JSON files
- file: src/domain/services/PlayerProgressionService.ts
  exists: true
```

Only write an assert you can express as a literal comparison. A rule too subtle to encode (`"the
knockout tiebreaker is goal difference then penalties"`) stays in prose, and gets a `> **Not
asserted.**` callout naming the code that is supposed to honour it.

## Links

Cross-reference with double-bracket wikilinks matching the file's basename without `.md`. Link liberally — a
link to a page that does not exist yet is a note that it should. Every page should be reachable from
`index.md`.

## Operations

### Ingest

A new source arrives (a REC PDF, a CBF endpoint dump, a season rollover).

1. Save it under `raw/`, register it in `raw/sources.md` with an id and retrieval date.
2. Read it. Write or update the affected pages under `competitions/` and `concepts/`.
3. Where the new source **contradicts** an existing page, do not silently overwrite. Record both in
   [[known-contradictions]] with citations, and say which one the seed data follows.
4. Update `index.md`. Append to `log.md`.

### Query

Read `index.md` first, then drill into the pages it names. Answer with citations — article numbers
for competition rules, `file:line` for code. If the answer is durable and not already on a page,
file it as a new page rather than leaving it in chat.

### Close-out (the main write path)

At the end of `execute-tasks` step 8, or at the end of a single-prompt change, apply the filter:

**Produces a wiki write**
- external evidence gathered
- a decision with a rationale the code cannot state
- a spec added or changed
- a contradiction discovered

**Produces nothing** (the common case)
- bug fixes, refactors, renames, new tests, styling, dependency bumps
- anything whose answer is "read the code"

Most tickets write nothing. That is correct and expected — a wiki that updates on every commit is a
worse copy of `git log`.

### Lint

```sh
npm run lint-wiki              # add --stale-days N to change the staleness threshold
```

`scripts/lint-wiki.cjs` runs five passes:

1. **Asserts** — every `asserts` entry still holds against the codebase.
2. **Links** — every wikilink resolves. Links inside code fences and backticks are ignored, so this
   file's own examples do not count.
3. **Orphans** — pages nothing links to. `index`, `log`, `CLAUDE` and `sources` are exempt.
4. **Staleness** — pages whose `verified` date is older than the threshold (240 days by default,
   chosen to fire once per season rather than once per sprint).
5. **Drift** — commits since the wiki last moved that did not touch `wiki/`. This is the only pass
   that catches changes made outside a ticket, including ones the user made by hand.

Broken asserts and broken links **fail** (exit 1). Orphans, staleness and drift **warn** (exit 0) —
they need judgement, not a red build.

**The watermark.** Drift is measured from the most recent `sha <hash>` written in `log.md`. Put one
on any entry that files real work, naming the commit the codebase was at. A commit that itself
touched `wiki/` is never reported as drift.

**What it cannot check.** Contradictions between pages, and any rule too subtle for a literal
comparison — a comparator's ordering, a hosting rule, a promotion mechanic. Those stay prose with a
`> **Not asserted.**` callout naming the code that should honour them, and a human re-reads them.

Report; do not auto-fix. The user decides.

## Conventions

- Prose wraps at 100 columns, matching the repo's Prettier config.
- Dates are ISO (`2026-09-05`) in frontmatter; Brazilian sources keep their `DD/MM/YYYY` form when
  quoted.
- Competition rules cite their article (`REC A1 Art. 26`). An uncited rule is a claim, not evidence.
- Never fabricate. When CBF publishes nothing, say so explicitly and mark it — see
  [[invented-data]] for how MS-102 handled it.
