import { beforeAll, describe, expect, it } from '@jest/globals';
import { getSeasonRoundCount } from '../../../../src/domain/features/phases/SeasonRoundCount';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import { useUniqueTeamIds } from '../../../support/seasonHarness';
import { ScriptedSeason } from '../../../support/scriptedSeason';
import {
  buildChampionship,
  lowerNumberWins,
  playUntil,
} from '../../../support/phasedSeasonHarness';

beforeAll(useUniqueTeamIds);

/** Plays the playable division round by round, recording the count before every round. */
function playRecordingCounts(season: ScriptedSeason): number[] {
  const counts: number[] = [];
  for (let guard = 0; guard < 200; guard++) {
    const { currentRound, rounds } = season.championship.matchContainer;
    counts.push(getSeasonRoundCount(season.championship));
    if (!rounds.some((round) => round.number === currentRound)) break;
    season.playRound();
  }
  return counts;
}

describe('getSeasonRoundCount', () => {
  describe.each([
    ['brasileirao-serie-a', 38],
    ['brasileirao-serie-b', 38],
    ['brasileirao-serie-c', 27],
    ['brasileirao-serie-d', 24],
    ['brasileirao-feminino-serie-a1', 23],
    ['brasileirao-feminino-serie-a2', 21],
    ['brasileirao-feminino-serie-a3', 14],
  ])('%s', (internalName, expected) => {
    let season: ScriptedSeason;
    let counts: number[];

    beforeAll(() => {
      season = new ScriptedSeason(internalName);
      counts = playRecordingCounts(season);
    });

    it(`is ${expected} on the fresh division`, () => {
      expect(counts[0]).toBe(expected);
    });

    it('equals the rounds the season actually generated', () => {
      const { rounds, totalRounds } = season.championship.matchContainer;
      expect(rounds).toHaveLength(expected);
      expect(totalRounds).toBe(expected);
    });

    it('holds at every point of the season, although phased rounds are generated as it goes', () => {
      expect(new Set(counts)).toEqual(new Set([expected]));
    });
  });

  it('follows an uneven group split and a double-legged follow-on phase', () => {
    // 10 clubs in 3 groups split 4 / 3 / 3: the group of 4 plays 3 rounds, the groups of 3 get a
    // bye and play 3 too. The top 2 of each group then play a 6-club double round-robin (10 rounds)
    // and the top 2 of that a two-legged final.
    const phases: ChampionshipPhase[] = [
      {
        kind: 'round-robin',
        name: '1ª Fase',
        numberOfGroups: 3,
        teamsPerGroup: 4,
        legs: 1,
        advancingPerGroup: 2,
      },
      {
        kind: 'round-robin',
        name: '2ª Fase',
        numberOfGroups: 1,
        teamsPerGroup: 6,
        legs: 2,
        advancingPerGroup: 2,
      },
      {
        kind: 'knockout',
        name: 'Final',
        numberOfTies: 1,
        legs: 2,
        secondLegHost: 'accumulated-points',
        tiebreakers: ['goal-difference', 'penalties'],
      },
    ];
    const championship = buildChampionship(10, phases);

    expect(getSeasonRoundCount(championship)).toBe(3 + 10 + 2);
    expect(playUntil(championship, lowerNumberWins).matchContainer.rounds).toHaveLength(15);
  });

  it('counts an odd single group with its bye rounds', () => {
    const phases: ChampionshipPhase[] = [
      {
        kind: 'round-robin',
        name: 'Liga',
        numberOfGroups: 1,
        teamsPerGroup: 5,
        legs: 2,
        advancingPerGroup: 2,
      },
    ];
    const championship = buildChampionship(5, phases);

    expect(getSeasonRoundCount(championship)).toBe(10);
    expect(playUntil(championship, lowerNumberWins).matchContainer.rounds).toHaveLength(10);
  });
});
