import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { getPlayableChampionship } from '../../../src/domain/features/pyramid/Pyramid';
import { init, useUniqueTeamIds } from '../../support/seasonHarness';

beforeAll(useUniqueTeamIds);

const names = (container: ChampionshipContainer) =>
  container.championships.map((championship) => championship.internalName);

describe('initChampionships loads the whole pyramid (MS-109)', () => {
  describe.each([
    [
      "men's, from Série D",
      'brasileirao-serie-d',
      ['brasileirao-serie-a', 'brasileirao-serie-b', 'brasileirao-serie-c', 'brasileirao-serie-d'],
    ],
    [
      "women's, from A3",
      'brasileirao-feminino-serie-a3',
      [
        'brasileirao-feminino-serie-a1',
        'brasileirao-feminino-serie-a2',
        'brasileirao-feminino-serie-a3',
      ],
    ],
  ])('%s', (_, entry, pyramid) => {
    let container: ChampionshipContainer;

    beforeAll(() => {
      container = init(entry);
    });

    it('holds every league division of the league type, top tier first', () => {
      expect(names(container)).toEqual(pyramid);
      expect(container.championships.map((championship) => championship.tier)).toEqual(
        pyramid.map((_, index) => index + 1)
      );
    });

    it('points at the entry division', () => {
      expect(container.playableInternalName).toBe(entry);
      expect(getPlayableChampionship(container).internalName).toBe(entry);
    });

    it('flags the entry division alone as the human’s', () => {
      expect(
        container.championships.map((championship) => championship.hasTeamControlledByHuman)
      ).toEqual(pyramid.map((internalName) => internalName === entry));
    });

    it('generates every division’s fixtures and zeroes its phase state', () => {
      for (const championship of container.championships) {
        expect(championship.matchContainer.rounds.length).toBeGreaterThan(0);
        expect(championship.matchContainer.currentRound).toBe(1);
        expect(championship.teams).toHaveLength(championship.numberOfTeams);
        if (championship.phases?.length) {
          expect(championship.currentPhaseIndex).toBe(0);
          expect(championship.survivingTeamIds).toHaveLength(championship.teams.length);
        }
      }
    });

    it('aligns every division on the same season', () => {
      const seasons = new Set(
        container.championships.map((championship) => championship.matchContainer.currentSeason)
      );
      expect(seasons.size).toBe(1);
    });

    it('loads no cups', () => {
      expect(container.cups).toBeUndefined();
    });
  });

  it('starts a men’s game from Série A with the same four divisions', () => {
    const container = init('brasileirao-serie-a');
    expect(names(container)).toHaveLength(4);
    expect(container.playableInternalName).toBe('brasileirao-serie-a');
  });

  it('refuses a cup as the entry division', () => {
    const result = ChampionshipService.initChampionships('copa-do-brasil-feminina');
    expect(result.succeeded).toBe(false);
    expect(result.error?.message).toBe('copa-do-brasil-feminina is not a league division.');
  });

  it('refuses an unknown entry division', () => {
    const result = ChampionshipService.initChampionships('nowhere');
    expect(result.succeeded).toBe(false);
    expect(result.error?.message).toBe('Championship not found.');
  });
});
