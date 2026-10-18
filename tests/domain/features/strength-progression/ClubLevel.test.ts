import { describe, expect, it } from '@jest/globals';
import {
  CLUB_BAND_SPREAD,
  PROMOTED_LEVEL_OFFSET,
  getClubBand,
  getNextSeasonLevel,
  getPromotedLevel,
  getRelegatedLevel,
  getSeasonLevelChange,
} from '../../../../src/domain/features/strength-progression/ClubLevel';

const serieC = { min: 25, max: 49 };
const a3 = { min: 1, max: 33 };

describe('constants', () => {
  it('spreads the band 3 either side and starts a moved club 3 inside its range', () => {
    expect(CLUB_BAND_SPREAD).toBe(3);
    expect(PROMOTED_LEVEL_OFFSET).toBe(3);
  });
});

describe('getClubBand', () => {
  it('reaches 3 either side of the level inside the range', () => {
    expect(getClubBand(37, serieC)).toEqual({ min: 34, max: 40 });
  });

  it('is cut at the range bottom', () => {
    expect(getClubBand(26, serieC)).toEqual({ min: 25, max: 29 });
    expect(getClubBand(1, a3)).toEqual({ min: 1, max: 4 });
  });

  it('is cut at the range top', () => {
    expect(getClubBand(48, serieC)).toEqual({ min: 45, max: 49 });
    expect(getClubBand(49, serieC)).toEqual({ min: 46, max: 49 });
  });
});

describe('getSeasonLevelChange', () => {
  it('gives the champion +2 and the last −2', () => {
    expect(getSeasonLevelChange(1, 20)).toBe(2);
    expect(getSeasonLevelChange(20, 20)).toBe(-2);
  });

  it('is about 0 in mid-table', () => {
    expect(getSeasonLevelChange(10, 20)).toBe(0);
    expect(getSeasonLevelChange(11, 20)).toBe(0);
    expect(getSeasonLevelChange(3, 5)).toBe(0);
  });

  it('is linear between the ends, rounded', () => {
    expect([1, 2, 3, 4, 5].map((rank) => getSeasonLevelChange(rank, 5))).toEqual([2, 1, 0, -1, -2]);
    expect(getSeasonLevelChange(5, 20)).toBe(1);
    expect(getSeasonLevelChange(16, 20)).toBe(-1);
  });

  it('gives a two-club division +2 and −2', () => {
    expect(getSeasonLevelChange(1, 2)).toBe(2);
    expect(getSeasonLevelChange(2, 2)).toBe(-2);
  });

  it('never moves a one-club division', () => {
    expect(getSeasonLevelChange(1, 1)).toBe(0);
  });

  it('never returns −0', () => {
    // rank 6 of 9 is 2 − 2.5 = −0.5, which Math.round sends to −0.
    expect(Object.is(getSeasonLevelChange(6, 9), 0)).toBe(true);
  });
});

describe('getNextSeasonLevel', () => {
  it('moves the level by the final rank', () => {
    expect(getNextSeasonLevel(37, 1, 20, serieC)).toBe(39);
    expect(getNextSeasonLevel(37, 20, 20, serieC)).toBe(35);
  });

  it('is clamped at the range top', () => {
    expect(getNextSeasonLevel(48, 1, 20, serieC)).toBe(49);
    expect(getNextSeasonLevel(49, 1, 20, serieC)).toBe(49);
  });

  it('is clamped at the range bottom', () => {
    expect(getNextSeasonLevel(26, 20, 20, serieC)).toBe(25);
    expect(getNextSeasonLevel(1, 32, 32, a3)).toBe(1);
  });
});

describe('promoted and relegated levels', () => {
  it('starts a promoted club at the new range min + 3', () => {
    expect(getPromotedLevel(serieC)).toBe(28);
    expect(getPromotedLevel(a3)).toBe(4);
  });

  it('starts a relegated club at the new range max − 3', () => {
    expect(getRelegatedLevel(serieC)).toBe(46);
    expect(getRelegatedLevel(a3)).toBe(30);
  });
});
