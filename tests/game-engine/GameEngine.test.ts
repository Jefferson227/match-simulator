import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GameEngine } from '../../game-engine/GameEngine';
import { GameState } from '../../game-engine/GameState';
import ChampionshipUseCases from '../../use-cases/ChampionshipUseCases';
import { Championship } from '../../core/models/Championship';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';

jest.mock('../../use-cases/ChampionshipUseCases');

const MockedChampionshipUseCases = ChampionshipUseCases as jest.MockedClass<
  typeof ChampionshipUseCases
>;

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
});
