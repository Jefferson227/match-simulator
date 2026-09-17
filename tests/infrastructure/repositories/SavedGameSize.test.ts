/**
 * MS-108: the cases MS-107 measured over `localStorage`'s quota.
 *
 * A played Série D season serialised to 5,133,791 code units against a 5,000,000-unit ceiling, so
 * `SAVE_GAME` threw `QuotaExceededError` and the game was silently not saved
 * (`.plans/MS-107/docs/05-MS-107-localstorage-quota-finding.md`). 86% of that was duplicated squads:
 * every `Match` embedded full copies of both clubs. Dehydrating those references at the save
 * boundary cuts a save by ~92%.
 *
 * These are the real containers, not fixtures — the numbers only mean something against the seeds
 * the game actually plays. Since MS-109 every container holds the whole pyramid of its league type,
 * so the men's cases carry Série A to D.
 */
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import GameStateMapper from '../../../src/infrastructure/mappers/GameStateMapper';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import LeagueType from '../../../src/domain/enums/LeagueType';
import { GameState } from '../../../src/game-engine/GameState';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';
import { currentRoundMatches, expectEquivalent } from '../../support/savedGameEquivalence';
import { getPlayableChampionship } from '../../../src/domain/features/pyramid/Pyramid';

/** `localStorage`'s ceiling, in UTF-16 code units — the unit the quota is actually counted in. */
const QUOTA = 5_000_000;

beforeAll(useUniqueTeamIds);

const stateOf = (
  championshipContainer: ChampionshipContainer,
  leagueType: LeagueType
): GameState => ({
  championshipContainer,
  hasError: false,
  errorMessage: '',
  leagueType,
  coachName: 'Tester',
  currentScreen: 'TeamManager',
  gameConfig: { clockSpeed: 250 },
});

const savedSize = (state: GameState) => JSON.stringify(GameStateMapper.dehydrate(state)).length;

const inMemorySize = (state: GameState) => JSON.stringify(state).length;

/** Every case: saves without throwing, round-trips, keeps the current round, and fits. */
function itBehaves(name: string, build: () => GameState) {
  describe(name, () => {
    let state: GameState;

    beforeAll(() => {
      state = build();
    });

    beforeEach(() => {
      window.localStorage.clear();
    });

    it('saves without exceeding the quota', () => {
      expect(() => GameRepository.saveGame(state)).not.toThrow();
    });

    it('round-trips under the equivalence rule', () => {
      GameRepository.saveGame(state);

      expectEquivalent(GameRepository.loadGame(), state);
    });

    it('brings the current round back byte-identical', () => {
      const before = currentRoundMatches(getPlayableChampionship(state.championshipContainer));

      GameRepository.saveGame(state);
      const after = currentRoundMatches(
        getPlayableChampionship(GameRepository.loadGame().championshipContainer)
      );

      expect(after).toEqual(before);
    });

    it(`serialises under ${QUOTA.toLocaleString('en-US')} code units`, () => {
      const size = savedSize(state);
      const inMemory = inMemorySize(state);
      const report =
        `${name}: ${size.toLocaleString('en-US')} code units saved, ` +
        `${inMemory.toLocaleString('en-US')} in memory ` +
        `(a ${Math.round((1 - size / inMemory) * 100)}% cut), ` +
        `quota ${QUOTA.toLocaleString('en-US')}.`;

      // Thrown rather than asserted so the numbers reach the failure output, which is the whole
      // point of a size guard: a regression has to say how far it drifted.
      if (size >= QUOTA) {
        throw new Error(`A saved game no longer fits in localStorage. ${report}`);
      }
      if (size >= inMemory) {
        throw new Error(`Dehydration saved nothing. ${report}`);
      }

      expect(size).toBeLessThan(QUOTA);
    });
  });
}

describe('a saved game fits in localStorage', () => {
  itBehaves('a played Série D season, with the whole men’s pyramid played alongside', () => {
    const season = new ScriptedSeason('brasileirao-serie-d');
    season.assignHuman(0);
    season.playToEnd();
    return stateOf(season.container, 'mens');
  });

  itBehaves('a men’s pyramid rolled over after the human went up D → C', () => {
    const season = new ScriptedSeason('brasileirao-serie-d');
    season.assignHuman(0);
    const rolledOver = season.playSeasonAndRollOver();

    // `expect` inside a builder would be invisible on failure, so assert it as state.
    if (rolledOver.playableInternalName !== 'brasileirao-serie-c') {
      throw new Error(
        `Expected the pointer to move to Série C, got ${rolledOver.playableInternalName}.`
      );
    }

    return stateOf(rolledOver, 'mens');
  });

  itBehaves('a played Série A3 season, with the whole women’s pyramid played alongside', () => {
    const season = new ScriptedSeason('brasileirao-feminino-serie-a3');
    season.assignHuman(0);
    season.playToEnd();
    return stateOf(season.container, 'womens');
  });

  itBehaves('a women’s pyramid rolled over after the human went up A3 → A2', () => {
    const season = new ScriptedSeason('brasileirao-feminino-serie-a3');
    season.assignHuman(0);
    return stateOf(season.playSeasonAndRollOver(), 'womens');
  });
});

describe('the rolled-over men’s pyramid', () => {
  let rolledOver: ChampionshipContainer;

  beforeAll(() => {
    const season = new ScriptedSeason('brasileirao-serie-d');
    season.assignHuman(0);
    season.playToEnd();
    rolledOver = season.rollOver();
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reloads with the human playing its new division', () => {
    GameRepository.saveGame(stateOf(rolledOver, 'mens'));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.playableInternalName).toBe('brasileirao-serie-c');

    const humanTeam = ChampionshipService.getTeamControlledByHuman(
      getPlayableChampionship(championshipContainer)
    );
    expect(humanTeam.succeeded).toBe(true);
    expect(humanTeam.getResult().id).toBe(
      ChampionshipService.getTeamControlledByHuman(getPlayableChampionship(rolledOver)).getResult()
        .id
    );
  });

  it('keeps every division of the pyramid, fixtures included', () => {
    GameRepository.saveGame(stateOf(rolledOver, 'mens'));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.championships.map((division) => division.internalName)).toEqual([
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ]);
    championshipContainer.championships.forEach((division) =>
      expect(division.matchContainer.rounds.length).toBeGreaterThan(0)
    );
  });
});
