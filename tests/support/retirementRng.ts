/**
 * Random providers for the retirement tests (MS-113).
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern.
 */
import { RandomProvider } from '../../src/domain/features/match-simulation/types';

/**
 * Returns `values` in order, then `fallback(min, max)` once they run out (the lowest value by
 * default). Throws when a scripted value is outside the bounds asked for, so a test that scripts
 * the wrong call fails loudly instead of passing by accident.
 */
export function scriptedRng(
  values: number[],
  fallback: (min: number, max: number) => number = (min) => min
): RandomProvider & { remaining: () => number } {
  const queue = [...values];
  return {
    remaining: () => queue.length,
    nextInt: (min: number, max: number) => {
      if (!queue.length) return fallback(min, max);
      const value = queue.shift() as number;
      if (value < min || value > max) {
        throw new Error(`Scripted value ${value} is outside nextInt(${min}, ${max}).`);
      }
      return value;
    },
  };
}

/** An rng that never makes a percentage roll succeed: every `nextInt` returns its maximum. */
export const neverRng: RandomProvider = { nextInt: (_min, max) => max };

/** A deterministic pseudo-random provider (mulberry32), for tests that simulate whole seasons. */
export function seededRng(seed: number): RandomProvider {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { nextInt: (min, max) => Math.floor(next() * (max - min + 1)) + min };
}
