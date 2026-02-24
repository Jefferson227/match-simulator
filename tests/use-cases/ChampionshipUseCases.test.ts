import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import ChampionshipUseCases from '../../use-cases/ChampionshipUseCases';
import ChampionshipService from '../../core/services/ChampionshipService';
import { GameState } from '../../game-engine/GameState';
import { Championship } from '../../core/models/Championship';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';
import Match from '../../core/models/Match';
import OperationResult from '../../core/results/OperationResult';
import { Team } from '../../core/models/Team';

jest.mock('../../core/services/ChampionshipService', () => ({
  __esModule: true,
  default: {
    initChampionships: jest.fn(),
    startRoundForAllChampionships: jest.fn(),
    endRoundForAllChampionships: jest.fn(),
    getChampionships: jest.fn(),
    getTeamControlledByHuman: jest.fn(),
    getMatchesForCurrentRound: jest.fn(),
  },
}));

const mockedChampionshipService = ChampionshipService as jest.Mocked<typeof ChampionshipService>;

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

function buildMockChampionship(): Championship {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mock Championship',
    internalName: 'mock-championship',
    numberOfTeams: 2,
    teams: [],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 2,
      rounds: [],
    },
    type: 'double-round-robin',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
  };
}

function buildState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: buildMockChampionship(),
    },
    hasError: false,
    errorMessage: '',
    currentScreen: 'home',
    gameConfig: {
      clockSpeed: 1000,
    },
  };
}

describe('ChampionshipUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initChampionships', () => {
    it('returns state with gameConfig and championshipContainer when service succeeds', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);
      const container: ChampionshipContainer = {
        playableChampionship: buildMockChampionship(),
      };

      mockedChampionshipService.initChampionships.mockReturnValue(successResult(container));

      const nextState = useCases.initChampionships('mock-championship');

      expect(mockedChampionshipService.initChampionships).toHaveBeenCalledWith('mock-championship');
      expect(nextState.championshipContainer).toEqual(container);
      expect(nextState.gameConfig.clockSpeed).toBe(250);
      expect(nextState.hasError).toBe(false);
    });

    it('returns error state when service fails', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);

      mockedChampionshipService.initChampionships.mockReturnValue(
        failureResult({} as ChampionshipContainer, 'Failed to initialize championships')
      );

      const nextState = useCases.initChampionships('bad-championship');

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Failed to initialize championships');
      expect(nextState.championshipContainer).toBe(initialState.championshipContainer);
    });
  });

  describe('startRoundForAllChampionships', () => {
    it('returns updated championshipContainer when service succeeds', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);
      const updatedContainer: ChampionshipContainer = {
        playableChampionship: {
          ...buildMockChampionship(),
          matchContainer: {
            ...buildMockChampionship().matchContainer,
            rounds: [
              {
                id: 'round-1',
                number: 1,
                status: 'in-progress',
                matches: [],
              },
            ],
          },
        },
      };

      mockedChampionshipService.startRoundForAllChampionships.mockReturnValue(
        successResult(updatedContainer)
      );

      const nextState = useCases.startRoundForAllChampionships();

      expect(nextState.championshipContainer).toEqual(updatedContainer);
      expect(nextState.hasError).toBe(false);
    });

    it('returns error state when service fails', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);

      mockedChampionshipService.startRoundForAllChampionships.mockReturnValue(
        failureResult({} as ChampionshipContainer, 'Start round failed')
      );

      const nextState = useCases.startRoundForAllChampionships();

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Start round failed');
      expect(nextState.championshipContainer).toBe(initialState.championshipContainer);
    });
  });

  describe('endRoundForAllChampionships', () => {
    it('returns updated championshipContainer when service succeeds', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);
      const updatedContainer: ChampionshipContainer = {
        playableChampionship: {
          ...buildMockChampionship(),
          matchContainer: {
            ...buildMockChampionship().matchContainer,
            currentRound: 2,
          },
        },
      };

      mockedChampionshipService.endRoundForAllChampionships.mockReturnValue(
        successResult(updatedContainer)
      );

      const nextState = useCases.endRoundForAllChampionships();

      expect(nextState.championshipContainer).toEqual(updatedContainer);
      expect(nextState.hasError).toBe(false);
    });

    it('returns error state when service fails', () => {
      const initialState = buildState();
      const useCases = new ChampionshipUseCases(initialState);

      mockedChampionshipService.endRoundForAllChampionships.mockReturnValue(
        failureResult({} as ChampionshipContainer, 'End round failed')
      );

      const nextState = useCases.endRoundForAllChampionships();

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('End round failed');
      expect(nextState.championshipContainer).toBe(initialState.championshipContainer);
    });
  });

  describe('getChampionships', () => {
    it('returns championships when service succeeds', () => {
      const championships = [buildMockChampionship()];
      const useCases = new ChampionshipUseCases(buildState());

      mockedChampionshipService.getChampionships.mockReturnValue(successResult(championships));

      const result = useCases.getChampionships();

      expect(result).toEqual(championships);
    });

    it('throws when service fails', () => {
      const useCases = new ChampionshipUseCases(buildState());

      mockedChampionshipService.getChampionships.mockReturnValue(
        failureResult([] as Championship[], 'No championships')
      );

      expect(() => useCases.getChampionships()).toThrow(
        'List of championships could not be found.'
      );
    });
  });

  describe('getTeamControlledByHuman', () => {
    it('returns the team controlled by human when service succeeds', () => {
      const useCases = new ChampionshipUseCases(buildState());
      const championship = buildMockChampionship();
      const team = {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fullName: 'Team A',
        shortName: 'A',
        abbreviation: 'AAA',
        colors: { outline: '#000', background: '#fff', text: '#000' },
        players: [],
        morale: 50,
        isControlledByHuman: true,
      } as Team;

      mockedChampionshipService.getTeamControlledByHuman.mockReturnValue(successResult(team));

      const result = useCases.getTeamControlledByHuman(championship);

      expect(result).toEqual(team);
    });

    it('throws when service fails', () => {
      const useCases = new ChampionshipUseCases(buildState());
      const championship = buildMockChampionship();

      mockedChampionshipService.getTeamControlledByHuman.mockReturnValue(
        failureResult({} as Team, 'No team controlled by human')
      );

      expect(() => useCases.getTeamControlledByHuman(championship)).toThrow(
        'Team controlled by human player could not be found.'
      );
    });
  });

  describe('getMatchesForCurrentRound', () => {
    it('returns matches when service succeeds', () => {
      const useCases = new ChampionshipUseCases(buildState());
      const championship = buildMockChampionship();
      const matches = [
        {
          id: 'match-1',
          homeTeam: {
            id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            fullName: 'Team A',
            shortName: 'A',
            abbreviation: 'AAA',
            colors: { outline: '#000', background: '#fff', text: '#000' },
            players: [],
            morale: 50,
            isControlledByHuman: false,
          },
          homeTeamScore: 0,
          awayTeamScore: 0,
          awayTeam: {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            fullName: 'Team B',
            shortName: 'B',
            abbreviation: 'BBB',
            colors: { outline: '#000', background: '#fff', text: '#000' },
            players: [],
            morale: 50,
            isControlledByHuman: false,
          },
          scorers: [],
        },
      ] as Match[];

      mockedChampionshipService.getMatchesForCurrentRound.mockReturnValue(successResult(matches));

      const result = useCases.getMatchesForCurrentRound(championship);

      expect(result).toEqual(matches);
    });

    it('throws when service fails', () => {
      const useCases = new ChampionshipUseCases(buildState());
      const championship = buildMockChampionship();

      mockedChampionshipService.getMatchesForCurrentRound.mockReturnValue(
        failureResult([] as Match[], 'No matches found')
      );

      expect(() => useCases.getMatchesForCurrentRound(championship)).toThrow(
        'Team controlled by human player could not be found.'
      );
    });
  });
});
