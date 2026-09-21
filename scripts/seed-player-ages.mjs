#!/usr/bin/env node
/**
 * Fills `age` on every player in both seed files.
 *
 * CBF publishes no birth dates and no reachable third party covers these squads
 * (see wiki/concepts/player-ages.md), so ages are generated rather than harvested.
 * The output is a pure function of each player's identity, so re-running this
 * reproduces the committed files byte for byte and a re-seed never reshuffles
 * ages that are already in someone's saved game.
 *
 * Usage: node scripts/seed-player-ages.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'infrastructure',
  'data'
);
const FILES = ['teams.json', 'teams-womens.json'];

// FNV-1a. Any stable hash would do; this one is short and has no dependencies.
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// [min, peak, max] per position. Keepers skew old and last longer; forwards skew young.
const BANDS = {
  GK: [19, 28, 41],
  DF: [17, 27, 39],
  MF: [17, 26, 38],
  FW: [17, 25, 38],
};

function ageFor(clubInternalName, playerName, position) {
  const [min, peak, max] = BANDS[position] ?? BANDS.MF;
  // Triangular inverse CDF: squads cluster around the peak but keep real tails,
  // so every stamina band in wiki/specs/player-stamina.md is actually populated.
  const u = hash(`${clubInternalName}|${playerName}|${position}`) / 0x100000000;
  const f = (peak - min) / (max - min);
  const x =
    u < f
      ? min + Math.sqrt(u * (max - min) * (peak - min))
      : max - Math.sqrt((1 - u) * (max - min) * (max - peak));
  return Math.min(max, Math.max(min, Math.round(x)));
}

for (const file of FILES) {
  const path = join(DATA_DIR, file);
  const teams = JSON.parse(readFileSync(path, 'utf8'));

  let count = 0;
  for (const team of teams) {
    for (const player of team.players) {
      player.age = ageFor(team.internalName, player.name, player.position);
      count++;
    }
  }

  writeFileSync(path, `${JSON.stringify(teams, null, 2)}\n`);
  console.log(`${file}: aged ${count} players`);
}
