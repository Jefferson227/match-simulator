// import { describe, expect, it, jest } from '@jest/globals';

import { GameEngine } from '../../game-engine/game-engine';
import { GameState } from '../../game-engine/game-state';
import { initChampionships } from '../../use-cases/ChampionshipUseCases';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';
import { Championship } from '../../core/models/Championship';

jest.mock('../../use-cases/ChampionshipUseCases', () => ({
  __esModule: true,
  initChampionships: jest.fn(),
}));

describe('GameEngine', () => {
  const initialState: GameState = {
    championshipContainer: {
      playableChampionship: {} as Championship,
    } as ChampionshipContainer,
  };

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
      playableChampionship: {} as Championship,
    } as ChampionshipContainer;

    const initChampionshipsMock = initChampionships as jest.Mock;
    initChampionshipsMock.mockReturnValue({
      succeeded: true,
      error: { errorCode: 'no-error', message: '', details: '' },
      getResult: () => mockContainer,
    });

    engine.dispatch({
      type: 'INIT_CHAMPIONSHIPS',
      championshipInternalName: 'brasileirao-serie-b',
    });

    expect(initChampionshipsMock).toHaveBeenCalledWith('brasileirao-serie-b');
    expect(engine.getState().championshipContainer).toBe(mockContainer);
  });
});
