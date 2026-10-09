/**
 * Where a new game's squads start (MS-115): inside their division's strength range, ordered as the
 * seed data orders the clubs. The linear map and the ±2 spread are invented — see
 * `wiki/concepts/invented-data.md`.
 */
import { RandomProvider } from '../match-simulation/types';
import { getRandomNumber } from '../../utils/Utils';
import { StrengthRange } from './StrengthRange';

/** How far either side of the club's target a player may start. Invented. */
export const PLAYER_STRENGTH_SPREAD = 2;

const defaultRng: RandomProvider = { nextInt: getRandomNumber };

/**
 * Each club's target strength: its seed `initialOverallStrength` mapped linearly from the
 * division's seed min..max onto `range`, so the strongest seed club lands on the range's top and
 * the weakest on its bottom. A division whose clubs share one seed strength maps to the midpoint.
 */
export function getClubTargets(seedStrengths: number[], range: StrengthRange): number[] {
  const seedMin = Math.min(...seedStrengths);
  const seedMax = Math.max(...seedStrengths);

  return seedStrengths.map((seed) =>
    seedMax === seedMin
      ? Math.round((range.min + range.max) / 2)
      : Math.round(range.min + ((seed - seedMin) / (seedMax - seedMin)) * (range.max - range.min))
  );
}

/** A player's starting strength: the club target ± the spread, kept inside `range`. */
export function rollPlayerStrength(
  target: number,
  range: StrengthRange,
  rng: RandomProvider = defaultRng
): number {
  const rolled = rng.nextInt(target - PLAYER_STRENGTH_SPREAD, target + PLAYER_STRENGTH_SPREAD);
  return Math.max(range.min, Math.min(range.max, rolled));
}
