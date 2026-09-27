/**
 * MS-113: the coach pool, the retired lists and the human club's retirement report survive a save
 * and a load, under save version 5; a version-4 save is abandoned, not migrated.
 *
 * Also measures what the retirees cost a men's save season after season, since `retiredPlayers`
 * only ever grows.
 */
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import GameStateMapper from '../../../src/infrastructure/mappers/GameStateMapper';
import ChampionshipUseCases from '../../../src/use-cases/ChampionshipUseCases';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { GameState } from '../../../src/game-engine/GameState';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import { getPlayableChampionship } from '../../../src/domain/features/pyramid/Pyramid';
import { finishAll, init, useUniqueTeamIds } from '../../support/seasonHarness';
import { seededRng } from '../../support/retirementRng';

const STORAGE_KEY = 'match-simulator-game-state-v2';

/** `localStorage`'s ceiling, in UTF-16 code units. */
const QUOTA = 5_000_000;

beforeAll(useUniqueTeamIds);

beforeEach(() => {
  window.localStorage.clear();
});

/** Every percentage roll succeeds: everyone retires and every retiree takes up coaching. */
const everyoneRetires: RandomProvider = {
  nextInt: (min, max) => (min === 0 && max === 1000 ? 0 : min),
};

function stateOf(championshipContainer: ChampionshipContainer): GameState {
  return {
    championshipContainer,
    hasError: false,
    errorMessage: '',
    currentScreen: 'TeamManager',
    gameConfig: { clockSpeed: 250 },
    leagueType: 'mens',
    coachName: 'Tester',
    coachPool: [],
    retiredPlayers: [],
    retiredCoaches: [],
  };
}

/** Série D's pyramid with the human on Série D's first club. */
function mensPyramid(): ChampionshipContainer {
  const container = init('brasileirao-serie-d');
  return {
    ...container,
    championships: container.championships.map((championship) =>
      championship.internalName !== container.playableInternalName
        ? championship
        : {
            ...championship,
            teams: championship.teams.map((team, index) =>
              index === 0 ? { ...team, isControlledByHuman: true } : team
            ),
          }
    ),
  };
}

/** Finishes the season and rolls it over, ageing everyone with `rng`. */
function nextSeason(state: GameState, rng: RandomProvider): GameState {
  const rolled = new ChampionshipUseCases({
    ...state,
    championshipContainer: finishAll(state.championshipContainer),
  }).runEndOfChampionshipActions({ rng });
  if (rolled.hasError) throw new Error(rolled.errorMessage);
  return rolled;
}

const retirementFields = (state: GameState) => ({
  coachPool: state.coachPool,
  retiredPlayers: state.retiredPlayers,
  retiredCoaches: state.retiredCoaches,
  lastSeasonRetirements: state.lastSeasonRetirements,
});

describe('retirement data across save and load (MS-113)', () => {
  let rolled: GameState;

  beforeAll(() => {
    rolled = nextSeason(stateOf(mensPyramid()), everyoneRetires);
  });

  it('writes save version 5', () => {
    GameRepository.saveGame(rolled);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).saveVersion).toBe(5);
  });

  it('brings the coach pool, retired lists and report back unchanged', () => {
    expect(rolled.coachPool.length).toBeGreaterThan(0);
    expect(rolled.retiredPlayers.length).toBeGreaterThan(0);
    expect(rolled.retiredCoaches.length).toBeGreaterThan(0);
    expect(rolled.lastSeasonRetirements?.entries.length).toBeGreaterThan(0);

    GameRepository.saveGame(rolled);

    expect(retirementFields(GameRepository.loadGame())).toEqual(retirementFields(rolled));
  });

  it('brings back the aged, replaced squads', () => {
    GameRepository.saveGame(rolled);
    const loaded = GameRepository.loadGame();

    expect(getPlayableChampionship(loaded.championshipContainer).teams).toEqual(
      getPlayableChampionship(rolled.championshipContainer).teams
    );
  });

  it('abandons a version-4 save', () => {
    const saved = GameStateMapper.dehydrate(rolled);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, saveVersion: 4 }));

    expect(GameRepository.hasSavedGame()).toBe(false);
    expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
  });
});

describe('save growth over five men’s seasons (MS-113)', () => {
  const SEASONS = 5;
  const sizes: { save: number; retirees: number }[] = [];

  beforeAll(() => {
    const rng = seededRng(113);
    let state = stateOf(mensPyramid());
    for (let season = 0; season < SEASONS; season++) {
      state = nextSeason(state, rng);
      sizes.push({
        save: JSON.stringify(GameStateMapper.dehydrate(state)).length,
        retirees: JSON.stringify(retirementFields(state)).length,
      });
    }
  });

  it('stays well inside the localStorage quota', () => {
    expect(sizes).toHaveLength(SEASONS);
    expect(Math.max(...sizes.map((size) => size.save))).toBeLessThan(QUOTA / 2);
  });

  it('grows by well under 100,000 code units a season from the retirement data', () => {
    const perSeason = sizes[SEASONS - 1].retirees / SEASONS;
    expect(perSeason).toBeLessThan(100_000);
  });
});
