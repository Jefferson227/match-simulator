/**
 * The rubber band that moves a player's strength (MS-115): every few team games a player steps up
 * or down, by how the club's morale stands, and is pulled back toward the division's range when
 * outside it. Pure — no randomness. The spec is `wiki/specs/player-strength-progression.md`.
 */
import { clampToScale, StrengthRange } from './StrengthRange';

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

/**
 * The strength after one change. Outside the range a player moves 2 back toward it, whatever the
 * direction — the rubber band pulls both ways, so a relegated squad comes down without its morale
 * collapsing first. Inside it they move 1 in `direction`, never past the bound they move toward.
 */
export function getStep(strength: number, range: StrengthRange, direction: Direction): number {
  if (strength > range.max) return clampToScale(strength - 2);
  if (strength < range.min) return clampToScale(strength + 2);
  if (direction === 'increase') return Math.min(strength + 1, range.max);
  return Math.max(strength - 1, range.min);
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
