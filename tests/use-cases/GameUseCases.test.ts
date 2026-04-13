import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import GameUseCases from '../../use-cases/GameUseCases';
import { GameState } from '../../game-engine/GameState';
import { Championship } from '../../src/domain/models/Championship';
import GameService from '../../src/domain/services/GameService';
import OperationResult from '../../src/domain/results/OperationResult';

jest.mock('../../src/domain/services/GameService', () => ({
  __esModule: true,
  default: {
    loadGame: jest.fn(),
    saveGame: jest.fn(),
  },
}));

const mockedGameService = GameService as jest.Mocked<typeof GameService>;

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
    },
    hasError: false,
    errorMessage: '',
    currentScreen: 'home',
    gameConfig: {
      clockSpeed: 750,
    },
  };
}

describe('GameUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setErrorMessage', () => {
    it('sets hasError=true and updates errorMessage', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.setErrorMessage('Something went wrong');

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Something went wrong');
      expect(nextState.currentScreen).toBe(state.currentScreen);
    });
  });

  describe('setCurrentScreen', () => {
    it('updates currentScreen', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.setCurrentScreen('match-simulator');

      expect(nextState.currentScreen).toBe('match-simulator');
      expect(nextState.gameConfig).toEqual(state.gameConfig);
    });
  });

  describe('updateClockSpeed', () => {
    it('updates only gameConfig.clockSpeed', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);

      const nextState = useCases.updateClockSpeed(1200);

      expect(nextState.gameConfig.clockSpeed).toBe(1200);
      expect(nextState.currentScreen).toBe(state.currentScreen);
      expect(nextState.championshipContainer).toEqual(state.championshipContainer);
    });
  });

  describe('saveGame', () => {
    it('returns the current state when service succeeds', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);
      const result = new OperationResult<void>(undefined);
      result.setSuccess();

      mockedGameService.saveGame.mockReturnValue(result);

      const nextState = useCases.saveGame();

      expect(mockedGameService.saveGame).toHaveBeenCalledWith(state);
      expect(nextState).toBe(state);
    });

    it('returns error state when service fails', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);
      const result = new OperationResult<void>(undefined);
      result.setError({ errorCode: 'exception', message: 'Save failed' });

      mockedGameService.saveGame.mockReturnValue(result);

      const nextState = useCases.saveGame();

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Save failed');
    });
  });

  describe('loadGame', () => {
    it('returns the loaded state when service succeeds', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);
      const loadedState = {
        ...state,
        currentScreen: 'TeamManager',
      };
      const result = new OperationResult<GameState>(loadedState);
      result.setSuccess();

      mockedGameService.loadGame.mockReturnValue(result);

      const nextState = useCases.loadGame();

      expect(mockedGameService.loadGame).toHaveBeenCalled();
      expect(nextState).toEqual(loadedState);
    });

    it('returns error state when service fails', () => {
      const state = buildState();
      const useCases = new GameUseCases(state);
      const result = new OperationResult<GameState>({} as GameState);
      result.setError({ errorCode: 'exception', message: 'Load failed' });

      mockedGameService.loadGame.mockReturnValue(result);

      const nextState = useCases.loadGame();

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Load failed');
    });
  });
});
