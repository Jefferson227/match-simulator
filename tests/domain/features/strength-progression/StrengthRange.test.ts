import { describe, expect, it } from '@jest/globals';
import {
  getDivisionStrengthRange,
  getStrengthRange,
} from '../../../../src/domain/features/strength-progression/StrengthRange';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipContainer from '../../../../src/domain/models/ChampionshipContainer';

function division(internalName: string, tier?: number): Championship {
  return {
    id: internalName,
    name: internalName,
    internalName,
    ...(tier !== undefined && { tier }),
    numberOfTeams: 0,
    teams: [],
    standings: [],
    matchContainer: { timer: 0, currentSeason: 2026, currentRound: 1, totalRounds: 0, rounds: [] },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
  } as Championship;
}

describe('getStrengthRange', () => {
  it("splits the men's four tiers into 75–99, 50–74, 25–49 and 1–24", () => {
    expect([1, 2, 3, 4].map((tier) => getStrengthRange(tier, 4))).toEqual([
      { min: 75, max: 99 },
      { min: 50, max: 74 },
      { min: 25, max: 49 },
      { min: 1, max: 24 },
    ]);
  });

  it("splits the women's three tiers into 67–99, 34–66 and 1–33", () => {
    expect([1, 2, 3].map((tier) => getStrengthRange(tier, 3))).toEqual([
      { min: 67, max: 99 },
      { min: 34, max: 66 },
      { min: 1, max: 33 },
    ]);
  });

  it('gives a single-tier pyramid the whole scale', () => {
    expect(getStrengthRange(1, 1)).toEqual({ min: 1, max: 99 });
  });

  it('leaves no gap and no overlap between neighbouring tiers', () => {
    for (let tierCount = 1; tierCount <= 6; tierCount++) {
      const ranges = Array.from({ length: tierCount }, (_, i) =>
        getStrengthRange(tierCount - i, tierCount)
      );
      expect(ranges[0].min).toBe(1);
      expect(ranges[tierCount - 1].max).toBe(99);
      ranges.slice(1).forEach((range, i) => expect(range.min).toBe(ranges[i].max + 1));
    }
  });
});

describe('getDivisionStrengthRange', () => {
  const container: ChampionshipContainer = {
    championships: [division('a', 1), division('b', 2), division('c', 3), division('d', 4)],
    playableInternalName: 'd',
    cups: [division('cup')],
  };

  it("reads the tier count from the container's pyramid", () => {
    expect(getDivisionStrengthRange(container, container.championships[3])).toEqual({
      min: 1,
      max: 24,
    });
    expect(getDivisionStrengthRange(container, container.championships[0])).toEqual({
      min: 75,
      max: 99,
    });
  });

  it('follows the pyramid when it has fewer tiers', () => {
    const threeTiers = { ...container, championships: container.championships.slice(0, 3) };
    expect(getDivisionStrengthRange(threeTiers, threeTiers.championships[2])).toEqual({
      min: 1,
      max: 33,
    });
  });

  it('reads the tier count off the lowest division, so a partial pyramid keeps its ranges', () => {
    const bottomOnly = { ...container, championships: [container.championships[3]] };
    expect(getDivisionStrengthRange(bottomOnly, bottomOnly.championships[0])).toEqual({
      min: 1,
      max: 24,
    });
  });

  it('returns undefined for a tierless cup', () => {
    expect(getDivisionStrengthRange(container, container.cups![0])).toBeUndefined();
  });
});
