import { describe, expect, it } from '@jest/globals';
import {
  getRetirementChance,
  rollChance,
  rollPercent,
  shouldRetire,
} from '../../../../src/domain/features/retirement/RetirementPolicy';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

/** An rng that always returns `value`, recording the bounds it was asked for. */
function fixedRng(value: number): RandomProvider & { calls: [number, number][] } {
  const calls: [number, number][] = [];
  return {
    calls,
    nextInt: (min: number, max: number) => {
      calls.push([min, max]);
      return value;
    },
  };
}

describe('getRetirementChance', () => {
  // Both edges of every band, so a boundary cannot drift by one year unnoticed.
  it.each([
    [17, 0.5],
    [30, 0.5],
    [31, 10],
    [34, 10],
    [35, 40],
    [38, 40],
    [39, 60],
    [42, 60],
    [43, 80],
    [44, 80],
    [45, 80],
    [60, 80],
  ])('a player aged %i retires with %d%% chance', (age, chance) => {
    expect(getRetirementChance(age, 'player')).toBe(chance);
  });

  it.each([
    [30, 0.5],
    [45, 0.5],
    [46, 10],
    [60, 10],
    [61, 40],
    [65, 40],
    [66, 60],
    [70, 60],
    [71, 80],
    [72, 80],
    [90, 80],
  ])('a coach aged %i retires with %d%% chance', (age, chance) => {
    expect(getRetirementChance(age, 'coach')).toBe(chance);
  });
});

describe('rollPercent', () => {
  it('asks for 0..1000 and scales to one decimal place', () => {
    const rng = fixedRng(345);
    expect(rollPercent(rng)).toBe(34.5);
    expect(rng.calls).toEqual([[0, 1000]]);
  });

  it('covers both ends of 0.0..100.0', () => {
    expect(rollPercent(fixedRng(0))).toBe(0);
    expect(rollPercent(fixedRng(1000))).toBe(100);
  });
});

describe('rollChance', () => {
  it('succeeds on a roll equal to the chance and fails 0.1 above it', () => {
    expect(rollChance(3, fixedRng(30))).toBe(true);
    expect(rollChance(3, fixedRng(31))).toBe(false);
  });
});

describe('shouldRetire', () => {
  it('retires on a roll equal to the chance', () => {
    expect(shouldRetire(30, 'player', fixedRng(5))).toBe(true);
    expect(shouldRetire(34, 'player', fixedRng(100))).toBe(true);
    expect(shouldRetire(46, 'coach', fixedRng(100))).toBe(true);
  });

  it('does not retire on a roll 0.1 above the chance', () => {
    expect(shouldRetire(30, 'player', fixedRng(6))).toBe(false);
    expect(shouldRetire(34, 'player', fixedRng(101))).toBe(false);
    expect(shouldRetire(46, 'coach', fixedRng(101))).toBe(false);
  });

  it('reads the band of the age it is given', () => {
    // 35 is in the 40% band, 34 in the 10% band: a roll of 25.0 separates them.
    expect(shouldRetire(35, 'player', fixedRng(250))).toBe(true);
    expect(shouldRetire(34, 'player', fixedRng(250))).toBe(false);
  });
});
