/**
 * The rubber band that moves a player's strength (MS-115): every few team games a player steps up
 * or down, by how the club's morale stands, pulled back toward the division's range when outside
 * it. Pure — no randomness. The spec is `wiki/specs/player-strength-progression.md`.
 */
import { MAX_STRENGTH, MIN_STRENGTH } from '../../constants/StrengthConstants';
import { StrengthRange } from './StrengthRange';

export type MoraleBand = 'low' | 'mid' | 'high';
export type AgeBand = 'young' | 'prime' | 'veteran';
export type Direction = 'increase' | 'decrease';

/** The fields the progression reads and writes. */
type ProgressingPlayer = { age: number; strength: number; strengthProgressGames: number };

/** Games per change, by morale band then age band. */
const INTERVALS: Record<MoraleBand, Record<AgeBand, number>> = {
  low: { young: 3, prime: 4, veteran: 5 },
  mid: { young: 3, prime: 4, veteran: 5 },
  high: { young: 1, prime: 2, veteran: 3 },
};

/** Low up to 30, mid up to 70, high above. Morale moves in 0.5 steps, so both edges are closed. */
export function getMoraleBand(morale: number): MoraleBand {
  if (morale <= 30) return 'low';
  if (morale <= 70) return 'mid';
  return 'high';
}

/** Up to 25 (under-16s included), 26–35, and 36 on. */
export function getAgeBand(age: number): AgeBand {
  if (age <= 25) return 'young';
  if (age <= 35) return 'prime';
  return 'veteran';
}

/** A low-morale club's players decline; every other club's improve. */
export function getDirection(moraleBand: MoraleBand): Direction {
  return moraleBand === 'low' ? 'decrease' : 'increase';
}

export function getInterval(moraleBand: MoraleBand, ageBand: AgeBand): number {
  return INTERVALS[moraleBand][ageBand];
}

function clampStrength(strength: number): number {
  return Math.max(MIN_STRENGTH, Math.min(MAX_STRENGTH, strength));
}

/**
 * The strength after one change. Inside the range a player moves 1, never past the bound it moves
 * toward. Outside it, moving back toward the range, they move 2. Already past the range in the
 * direction of travel, they stay put.
 */
export function getStep(strength: number, range: StrengthRange, direction: Direction): number {
  if (direction === 'increase') {
    if (strength > range.max) return strength;
    if (strength < range.min) return clampStrength(strength + 2);
    return clampStrength(Math.min(strength + 1, range.max));
  }

  if (strength < range.min) return strength;
  if (strength > range.max) return clampStrength(strength - 2);
  return clampStrength(Math.max(strength - 1, range.min));
}

/**
 * `player` after one more team game. The counter is raised; once it reaches the interval for the
 * player's current morale and age bands, the change is applied and the counter starts again.
 */
export function advancePlayer<P extends ProgressingPlayer>(
  player: P,
  morale: number,
  range: StrengthRange
): P {
  const games = player.strengthProgressGames + 1;
  const moraleBand = getMoraleBand(morale);

  if (games < getInterval(moraleBand, getAgeBand(player.age))) {
    return { ...player, strengthProgressGames: games };
  }

  return {
    ...player,
    strength: getStep(player.strength, range, getDirection(moraleBand)),
    strengthProgressGames: 0,
  };
}
