/**
 * The rubber band that moves a player's strength (MS-115, reworked by MS-116): every few team games
 * a player's strength is due a change, by the club's morale and the player's age. Inside the club's
 * band a gain is rolled, less likely the nearer the band's top, a loss is certain, and mid morale
 * holds a grown player where they are; outside the band the player is pulled back toward it. The
 * only randomness is the injected `rng`. The spec is `wiki/specs/player-strength-progression.md`.
 */
import { RandomProvider } from '../match-simulation/types';
import { clampToScale, StrengthRange } from './StrengthRange';

export type MoraleBand = 'low' | 'mid' | 'high';
export type AgeBand = 'developing' | 'peak' | 'experienced' | 'veteran';
export type Direction = 'increase' | 'hold' | 'decrease';

/** The fields the progression reads and writes. */
type ProgressingPlayer = { age: number; strength: number; strengthProgressGames: number };

/** Which way a due change goes inside the band, by age band then morale band. Invented. */
const DIRECTIONS: Record<AgeBand, Record<MoraleBand, Direction>> = {
  developing: { low: 'decrease', mid: 'increase', high: 'increase' },
  peak: { low: 'decrease', mid: 'hold', high: 'increase' },
  experienced: { low: 'decrease', mid: 'hold', high: 'hold' },
  veteran: { low: 'decrease', mid: 'decrease', high: 'decrease' },
};

/** Games per change, by age band then morale band. Invented. */
const INTERVALS: Record<AgeBand, Record<MoraleBand, number>> = {
  developing: { low: 3, mid: 3, high: 2 },
  peak: { low: 4, mid: 4, high: 2 },
  experienced: { low: 4, mid: 4, high: 3 },
  veteran: { low: 3, mid: 3, high: 3 },
};

/** Low up to 30, mid up to 70, high above. Morale moves in 0.5 steps, so both edges are closed. */
export function getMoraleBand(morale: number): MoraleBand {
  if (morale <= 30) return 'low';
  if (morale <= 70) return 'mid';
  return 'high';
}

/** Up to 23 (under-16s included), 24–29, 30–33, and 34 on. */
export function getAgeBand(age: number): AgeBand {
  if (age <= 23) return 'developing';
  if (age <= 29) return 'peak';
  if (age <= 33) return 'experienced';
  return 'veteran';
}

export function getDirection(moraleBand: MoraleBand, ageBand: AgeBand): Direction {
  return DIRECTIONS[ageBand][moraleBand];
}

export function getInterval(moraleBand: MoraleBand, ageBand: AgeBand): number {
  return INTERVALS[ageBand][moraleBand];
}

/**
 * The strength after one due change. Outside `band` a player moves 2 back toward it, whatever the
 * direction — the rubber band pulls both ways, so a relegated squad comes down without its morale
 * collapsing first. Inside it a hold changes nothing, a decrease takes 1, never below the band, and
 * an increase adds 1 with probability `(band.max − strength) / (band.max − band.min)`: certain at
 * the band's bottom, never at its top. A one-point band has nothing to roll for.
 */
export function getStep(
  strength: number,
  band: StrengthRange,
  direction: Direction,
  rng: RandomProvider
): number {
  if (strength > band.max) return clampToScale(strength - 2);
  if (strength < band.min) return clampToScale(strength + 2);
  if (direction === 'hold') return strength;
  if (direction === 'decrease') return Math.max(strength - 1, band.min);
  if (band.max === band.min) return strength;

  const gains = rng.nextInt(1, band.max - band.min) <= band.max - strength;
  return gains ? Math.min(strength + 1, band.max) : strength;
}

/**
 * `player` after one more team game. The counter is raised; once it reaches the interval for the
 * player's current morale and age bands, the change is due: it is applied and the counter starts
 * again — also when the change comes out as none, a hold or a lost roll.
 */
export function advancePlayer<P extends ProgressingPlayer>(
  player: P,
  morale: number,
  band: StrengthRange,
  rng: RandomProvider
): P {
  const games = player.strengthProgressGames + 1;
  const moraleBand = getMoraleBand(morale);
  const ageBand = getAgeBand(player.age);

  if (games < getInterval(moraleBand, ageBand)) {
    return { ...player, strengthProgressGames: games };
  }

  return {
    ...player,
    strength: getStep(player.strength, band, getDirection(moraleBand, ageBand), rng),
    strengthProgressGames: 0,
  };
}
