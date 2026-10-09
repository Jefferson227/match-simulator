import { describe, expect, it } from '@jest/globals';
import {
  getClubTargets,
  rollPlayerStrength,
} from '../../../../src/domain/features/strength-progression/SeedStrength';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

const range = { min: 25, max: 49 };
const lowest: RandomProvider = { nextInt: (min) => min };
const highest: RandomProvider = { nextInt: (_min, max) => max };

describe('getClubTargets', () => {
  it('maps the seed min..max linearly onto the range, keeping the order', () => {
    expect(getClubTargets([60, 70, 80], range)).toEqual([25, 37, 49]);
    expect(getClubTargets([80, 60, 65], range)).toEqual([49, 25, 31]);
  });

  it('maps a division whose clubs share one strength to the midpoint', () => {
    expect(getClubTargets([70, 70], range)).toEqual([37, 37]);
    expect(getClubTargets([70], { min: 1, max: 24 })).toEqual([13]);
  });
});

describe('rollPlayerStrength', () => {
  it('rolls within 2 of the target', () => {
    expect(rollPlayerStrength(37, range, lowest)).toBe(35);
    expect(rollPlayerStrength(37, range, highest)).toBe(39);
  });

  it('keeps the roll inside the range', () => {
    expect(rollPlayerStrength(49, range, highest)).toBe(49);
    expect(rollPlayerStrength(25, range, lowest)).toBe(25);
  });
});
