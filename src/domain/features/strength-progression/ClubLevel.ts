/**
 * A club's level (MS-116): its own place inside its division's strength range, so a division's
 * squads settle at different strengths instead of all climbing to the range's top. The band around
 * the level is what the rubber band pulls toward; the level itself moves once a season. The spread,
 * the season change and the promotion and relegation offsets are invented — see
 * `wiki/concepts/invented-data.md`. The spec is `wiki/specs/player-strength-progression.md`.
 */
import { StrengthRange } from './StrengthRange';

/** How far either side of its level a club's band reaches. Invented. */
export const CLUB_BAND_SPREAD = 3;

/** How far inside the new range a promoted or relegated club's level starts. Invented. */
export const PROMOTED_LEVEL_OFFSET = 3;

/** The most a season can move a staying club's level, up for the champion, down for the last. */
const MAX_SEASON_LEVEL_CHANGE = 2;

const clampToRange = (value: number, range: StrengthRange): number =>
  Math.max(range.min, Math.min(range.max, value));

/** `level` ± the spread, cut to `range`. */
export function getClubBand(level: number, range: StrengthRange): StrengthRange {
  return {
    min: clampToRange(level - CLUB_BAND_SPREAD, range),
    max: clampToRange(level + CLUB_BAND_SPREAD, range),
  };
}

/**
 * The level change a final `rank` (1 = champion) out of `clubCount` earns: linear from +2 for the
 * champion to −2 for the last, rounded, so mid-table is about 0. A one-club division never moves.
 */
export function getSeasonLevelChange(rank: number, clubCount: number): number {
  if (clubCount <= 1) return 0;
  const change =
    MAX_SEASON_LEVEL_CHANGE - (2 * MAX_SEASON_LEVEL_CHANGE * (rank - 1)) / (clubCount - 1);
  // `Math.round` sends −0.5 to −0; `+ 0` turns it into 0.
  return Math.round(change) + 0;
}

/** A staying club's level for the next season: moved by its final rank, kept inside `range`. */
export function getNextSeasonLevel(
  level: number,
  rank: number,
  clubCount: number,
  range: StrengthRange
): number {
  return clampToRange(level + getSeasonLevelChange(rank, clubCount), range);
}

/** A club arriving from the division below starts near the bottom of its new `range`. */
export function getPromotedLevel(range: StrengthRange): number {
  return clampToRange(range.min + PROMOTED_LEVEL_OFFSET, range);
}

/** A club arriving from the division above starts near the top of its new `range`. */
export function getRelegatedLevel(range: StrengthRange): number {
  return clampToRange(range.max - PROMOTED_LEVEL_OFFSET, range);
}
