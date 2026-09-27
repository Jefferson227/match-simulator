import { RandomProvider } from '../match-simulation/types';
import {
  COACH_RETIREMENT_BANDS,
  PLAYER_RETIREMENT_BANDS,
  RetirementBand,
} from '../../constants/RetirementConstants';

export type RetirementRole = 'player' | 'coach';

const BANDS_BY_ROLE: Record<RetirementRole, RetirementBand[]> = {
  player: PLAYER_RETIREMENT_BANDS,
  coach: COACH_RETIREMENT_BANDS,
};

/** Chance of retiring at `age`, in percent. The bands end open-ended, so every age has one. */
export function getRetirementChance(age: number, role: RetirementRole): number {
  const bands = BANDS_BY_ROLE[role];
  const band = bands.find((candidate) => age <= candidate.maxAge) ?? bands[bands.length - 1];
  return band.chance;
}

/** A roll between 0.0 and 100.0 inclusive, in steps of 0.1. */
export function rollPercent(rng: RandomProvider): number {
  return rng.nextInt(0, 1000) / 10;
}

/** Whether a roll lands within `chance` percent. A roll equal to the chance succeeds. */
export function rollChance(chance: number, rng: RandomProvider): boolean {
  return rollPercent(rng) <= chance;
}

/** Whether someone of `age` retires this season. Rolled against the age they have just reached. */
export function shouldRetire(age: number, role: RetirementRole, rng: RandomProvider): boolean {
  return rollChance(getRetirementChance(age, role), rng);
}
