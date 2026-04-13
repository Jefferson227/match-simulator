import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import GameService from '../../../src/domain/services/GameService';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import { GameState } from '../../../src/game-engine/GameState';
import { Championship } from '../../../src/domain/models/Championship';

jest.mock('../../../src/infrastructure/repositories/GameRepository', () => ({
  __esModule: true,
  default: {
    loadGame: jest.fn(),
    saveGame: jest.fn(),
  },
}));

const mockedGameRepository = GameRepository as jest.Mocked<typeof GameRepository>;

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
    currentScreen: 'TeamManager',
    gameConfig: {
      clockSpeed: 1000,
    },
  };
}

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the saved game when repository succeeds', () => {
    const state = buildState();
    mockedGameRepository.loadGame.mockReturnValue(state);

    const result = GameService.loadGame();

    expect(result.succeeded).toBe(true);
    expect(result.getResult()).toEqual(state);
  });

  it('returns error when load repository throws', () => {
    mockedGameRepository.loadGame.mockImplementation(() => {
      throw new Error('Load failed');
    });

    const result = GameService.loadGame();

    expect(result.succeeded).toBe(false);
    expect(result.error.message).toBe('Load failed');
  });

  it('saves the game when repository succeeds', () => {
    const state = buildState();

    const result = GameService.saveGame(state);

    expect(mockedGameRepository.saveGame).toHaveBeenCalledWith(state);
    expect(result.succeeded).toBe(true);
  });

  it('returns error when save repository throws', () => {
    const state = buildState();
    mockedGameRepository.saveGame.mockImplementation(() => {
      throw new Error('Save failed');
    });

    const result = GameService.saveGame(state);

    expect(result.succeeded).toBe(false);
    expect(result.error.message).toBe('Save failed');
  });
});
