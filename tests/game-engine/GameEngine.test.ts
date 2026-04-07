import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GameEngine } from '../../game-engine/GameEngine';
import { GameState } from '../../game-engine/GameState';
import ChampionshipUseCases from '../../use-cases/ChampionshipUseCases';
import GameUseCases from '../../use-cases/GameUseCases';
import { Championship } from '../../core/models/Championship';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';

jest.mock('../../use-cases/ChampionshipUseCases');
jest.mock('../../use-cases/GameUseCases');

const MockedChampionshipUseCases = ChampionshipUseCases as jest.MockedClass<
  typeof ChampionshipUseCases
>;
const MockedGameUseCases = GameUseCases as jest.MockedClass<typeof GameUseCases>;

function buildState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mock Championship',
        internalName: 'mock-championship',
        numberOfTeams: 0,
        teams: [],
        standings: [],
        matchContainer: {
          timer: 0,
          currentSeason: 2026,
          currentRound: 1,
          totalRounds: 0,
          rounds: [],
        },
        type: 'double-round-robin',
        hasTeamControlledByHuman: false,
        isPromotable: false,
        isRelegatable: false,
      } as Championship,
    } as ChampionshipContainer,
    hasError: false,
    errorMessage: '',
    currentScreen: 'home',
    gameConfig: {
      clockSpeed: 1000,
    },
  };
}

describe('GameEngine', () => {
  const initialState = buildState();

  beforeEach(() => {
    jest.clearAllMocks();
    MockedGameUseCases.mockImplementation(
      () =>
        ({
          loadGame: jest.fn().mockReturnValue(initialState),
          saveGame: jest.fn().mockReturnValue(initialState),
          setErrorMessage: jest.fn().mockReturnValue(initialState),
          setCurrentScreen: jest.fn().mockReturnValue(initialState),
          updateClockSpeed: jest.fn().mockReturnValue(initialState),
        }) as unknown as GameUseCases
    );
  });

  it('returns the initial state', () => {
    const engine = new GameEngine(initialState);

    expect(engine.getState()).toBe(initialState);
  });

  it('notifies listeners when actions are dispatched', () => {
    const engine = new GameEngine(initialState);
    const listener = jest.fn();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    engine.subscribe(listener);
    engine.dispatch({ type: 'PING' });

    expect(listener).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it('unsubscribes listeners', () => {
    const engine = new GameEngine(initialState);
    const listener = jest.fn();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const unsubscribe = engine.subscribe(listener);
    unsubscribe();
    engine.dispatch({ type: 'PING' });

    expect(listener).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('sets the championship container when initializing championships', () => {
    const engine = new GameEngine(initialState);
    const mockContainer = {
      playableChampionship: {
        ...initialState.championshipContainer.playableChampionship,
        internalName: 'brasileirao-serie-b',
      },
    } as ChampionshipContainer;

    const updatedState: GameState = {
      ...initialState,
      championshipContainer: mockContainer,
      gameConfig: {
        clockSpeed: 250,
      },
    };
    const initChampionshipsMock = jest.fn().mockReturnValue(updatedState);

    MockedChampionshipUseCases.mockImplementation(
      () =>
        ({
          initChampionships: initChampionshipsMock,
        }) as ChampionshipUseCases
    );

    engine.dispatch({
      type: 'INIT_CHAMPIONSHIPS',
      championshipInternalName: 'brasileirao-serie-b',
    });

    expect(initChampionshipsMock).toHaveBeenCalledWith('brasileirao-serie-b');
    expect(engine.getState().championshipContainer).toBe(mockContainer);
  });

  it('runs end-of-championship actions through ChampionshipUseCases', () => {
    const engine = new GameEngine(initialState);
    const updatedState: GameState = {
      ...initialState,
      championshipContainer: {
        playableChampionship: {
          ...initialState.championshipContainer.playableChampionship,
          name: 'Updated Championship',
        },
      } as ChampionshipContainer,
    };
    const runEndOfChampionshipActionsMock = jest.fn().mockReturnValue(updatedState);

    MockedChampionshipUseCases.mockImplementation(
      () =>
        ({
          runEndOfChampionshipActions: runEndOfChampionshipActionsMock,
        }) as ChampionshipUseCases
    );

    engine.dispatch({ type: 'RUN_END_OF_CHAMPIONSHIP_ACTIONS' });

    expect(runEndOfChampionshipActionsMock).toHaveBeenCalled();
    expect(engine.getState().championshipContainer).toEqual(updatedState.championshipContainer);
  });

  it('loads the game through GameUseCases', () => {
    const engine = new GameEngine(initialState);
    const loadedState: GameState = {
      ...initialState,
      currentScreen: 'TeamManager',
    };
    const loadGameMock = jest.fn().mockReturnValue(loadedState);

    MockedChampionshipUseCases.mockImplementation(
      () => ({}) as ChampionshipUseCases
    );

    MockedGameUseCases.mockImplementation(
      () =>
        ({
          loadGame: loadGameMock,
        }) as unknown as GameUseCases
    );

    engine.dispatch({ type: 'LOAD_GAME' });

    expect(loadGameMock).toHaveBeenCalled();
    expect(engine.getState()).toEqual(loadedState);
  });

  it('saves the game through GameUseCases without changing state', () => {
    const engine = new GameEngine(initialState);
    const saveGameMock = jest.fn().mockReturnValue(initialState);

    MockedGameUseCases.mockImplementation(
      () =>
        ({
          saveGame: saveGameMock,
        }) as unknown as GameUseCases
    );

    engine.dispatch({ type: 'SAVE_GAME' });

    expect(saveGameMock).toHaveBeenCalled();
    expect(engine.getState()).toEqual(initialState);
  });
});
