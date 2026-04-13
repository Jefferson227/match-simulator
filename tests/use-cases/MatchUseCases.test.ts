import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import MatchUseCases from '../../use-cases/MatchUseCases';
import MatchService from '../../src/domain/services/MatchService';
import { GameState } from '../../game-engine/GameState';
import { Championship } from '../../src/domain/models/Championship';
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import OperationResult from '../../src/domain/results/OperationResult';

jest.mock('../../src/domain/services/MatchService', () => ({
  __esModule: true,
  default: {
    runMatchActions: jest.fn(),
  },
}));

const mockedMatchService = MatchService as jest.Mocked<typeof MatchService>;

function successResult<T>(value: T): OperationResult<T> {
  const result = new OperationResult(value);
  result.setSuccess();
  return result;
}

function failureResult<T>(fallbackValue: T, message: string): OperationResult<T> {
  const result = new OperationResult(fallbackValue);
  result.setError({ errorCode: 'exception', message });
  return result;
}

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
    currentScreen: 'MatchSimulator',
    gameConfig: {
      clockSpeed: 500,
    },
  };
}

describe('MatchUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates championshipContainer when service succeeds', () => {
    const state = buildState();
    const useCases = new MatchUseCases(state);
    const updatedContainer: ChampionshipContainer = {
      playableChampionship: {
        ...state.championshipContainer.playableChampionship,
        matchContainer: {
          ...state.championshipContainer.playableChampionship.matchContainer,
          timer: 1,
        },
      },
    };

    mockedMatchService.runMatchActions.mockReturnValue(successResult(updatedContainer));

    const nextState = useCases.runMatchActions();

    expect(nextState.hasError).toBe(false);
    expect(nextState.championshipContainer).toEqual(updatedContainer);
  });

  it('sets error in state when service fails', () => {
    const state = buildState();
    const useCases = new MatchUseCases(state);

    mockedMatchService.runMatchActions.mockReturnValue(
      failureResult({} as ChampionshipContainer, 'Failed to run match actions')
    );

    const nextState = useCases.runMatchActions();

    expect(nextState.hasError).toBe(true);
    expect(nextState.errorMessage).toBe('Failed to run match actions');
    expect(nextState.championshipContainer).toBe(state.championshipContainer);
  });
});
