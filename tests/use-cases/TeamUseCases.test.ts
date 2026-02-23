import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import TeamUseCases from '../../use-cases/TeamUseCases';
import TeamService from '../../core/services/TeamService';
import { GameState } from '../../game-engine/game-state';
import { Championship } from '../../core/models/Championship';
import Player from '../../core/models/Player';
import { Team } from '../../core/models/Team';
import OperationResult from '../../core/results/OperationResult';

jest.mock('../../core/services/TeamService', () => ({
  __esModule: true,
  default: {
    getTeamsToSelect: jest.fn(),
    selectTeam: jest.fn(),
    setStartersAndSubs: jest.fn(),
  },
}));

const mockedTeamService = TeamService as jest.Mocked<typeof TeamService>;

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

function buildPlayers(): { starter: Player; sub: Player; spare: Player } {
  return {
    starter: {
      id: '11111111-1111-1111-1111-111111111111',
      position: 'GK',
      name: 'Starter',
      strength: 80,
      isStarter: true,
      isSub: false,
    },
    sub: {
      id: '22222222-2222-2222-2222-222222222222',
      position: 'GK',
      name: 'Sub',
      strength: 70,
      isStarter: false,
      isSub: true,
    },
    spare: {
      id: '33333333-3333-3333-3333-333333333333',
      position: 'GK',
      name: 'Spare',
      strength: 60,
      isStarter: false,
      isSub: false,
    },
  };
}

function buildTeams(): { homeTeam: Team; awayTeam: Team } {
  const players = buildPlayers();

  return {
    homeTeam: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      fullName: 'Home Team',
      shortName: 'Home',
      abbreviation: 'HOM',
      colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
      players: [players.starter, players.sub, players.spare],
      morale: 50,
      isControlledByHuman: false,
    },
    awayTeam: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      fullName: 'Away Team',
      shortName: 'Away',
      abbreviation: 'AWY',
      colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
      players: [players.starter, players.sub],
      morale: 50,
      isControlledByHuman: false,
    },
  };
}

function buildChampionship(): Championship {
  const teams = buildTeams();

  return {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Mock Championship',
    internalName: 'mock-championship',
    numberOfTeams: 2,
    teams: [teams.homeTeam, teams.awayTeam],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 2,
      rounds: [
        {
          id: 'round-1',
          number: 1,
          status: 'in-progress',
          matches: [
            {
              id: 'match-1',
              homeTeam: teams.homeTeam,
              homeTeamScore: 0,
              awayTeamScore: 0,
              awayTeam: teams.awayTeam,
              scorers: [],
            },
          ],
        },
      ],
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
      playableChampionship: buildChampionship(),
    },
    hasError: false,
    errorMessage: '',
    currentScreen: 'team-selector',
    gameConfig: {
      clockSpeed: 500,
    },
  };
}

describe('TeamUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeamsToSelect', () => {
    it('returns teams when service succeeds', () => {
      const state = buildState();
      const championship = state.championshipContainer.playableChampionship;
      const useCases = new TeamUseCases(state);

      mockedTeamService.getTeamsToSelect.mockReturnValue(successResult(championship.teams));

      const teams = useCases.getTeamsToSelect(championship);

      expect(teams).toEqual(championship.teams);
    });

    it('throws when service fails', () => {
      const state = buildState();
      const championship = state.championshipContainer.playableChampionship;
      const useCases = new TeamUseCases(state);

      mockedTeamService.getTeamsToSelect.mockReturnValue(failureResult([] as Team[], 'No teams'));

      expect(() => useCases.getTeamsToSelect(championship)).toThrow(
        'List of teams could not be found from championship.'
      );
    });
  });

  describe('selectTeam', () => {
    it('updates playableChampionship when service succeeds', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const updatedChampionship = {
        ...state.championshipContainer.playableChampionship,
        hasTeamControlledByHuman: true,
      };

      mockedTeamService.selectTeam.mockReturnValue(successResult(updatedChampionship));

      const nextState = useCases.selectTeam('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

      expect(nextState.championshipContainer.playableChampionship).toEqual(updatedChampionship);
      expect(nextState.hasError).toBe(false);
    });

    it('returns error state when service fails', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);

      mockedTeamService.selectTeam.mockReturnValue(
        failureResult({} as Championship, 'Unable to select team')
      );

      const nextState = useCases.selectTeam('unknown-team');

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Unable to select team');
    });
  });

  describe('setStartersAndSubs', () => {
    it('adds updated team to playableChampionship teams when service succeeds', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const players = buildPlayers();
      const updatedTeam = {
        ...state.championshipContainer.playableChampionship.teams[0],
        players: [players.starter, players.sub, players.spare].map((p) => ({
          ...p,
          isStarter: p.id === players.sub.id,
          isSub: p.id === players.starter.id,
        })),
      };

      mockedTeamService.setStartersAndSubs.mockReturnValue(successResult(updatedTeam));

      const nextState = useCases.setStartersAndSubs(
        updatedTeam.id,
        [players.sub],
        [players.starter]
      );

      expect(nextState.hasError).toBe(false);
      expect(nextState.championshipContainer.playableChampionship.teams).toHaveLength(3);
      expect(nextState.championshipContainer.playableChampionship.teams[2]).toEqual(updatedTeam);
    });

    it('returns error state when service fails', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const players = buildPlayers();

      mockedTeamService.setStartersAndSubs.mockReturnValue(
        failureResult({} as Team, 'Invalid lineup')
      );

      const nextState = useCases.setStartersAndSubs('bad-id', [players.starter], [players.sub]);

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Invalid lineup');
    });
  });

  describe('substitutePlayer', () => {
    it('updates match team players for the current round', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const homeTeam = state.championshipContainer.playableChampionship.teams[0];
      const matchId = state.championshipContainer.playableChampionship.matchContainer.rounds[0]
        .matches[0].id;

      const nextState = useCases.substitutePlayer(
        matchId,
        homeTeam.id,
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
      );

      const updatedPlayers =
        nextState.championshipContainer.playableChampionship.matchContainer.rounds[0].matches[0]
          .homeTeam.players;
      const oldStarter = updatedPlayers.find(
        (player) => player.id === '11111111-1111-1111-1111-111111111111'
      );
      const promotedSub = updatedPlayers.find(
        (player) => player.id === '22222222-2222-2222-2222-222222222222'
      );

      expect(nextState.hasError).toBe(false);
      expect(oldStarter).toMatchObject({ isStarter: false, isSub: false });
      expect(promotedSub).toMatchObject({ isStarter: true, isSub: false });
    });

    it('returns error state when match does not exist', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const homeTeam = state.championshipContainer.playableChampionship.teams[0];

      const nextState = useCases.substitutePlayer(
        'unknown-match',
        homeTeam.id,
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
      );

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Match could not be found to confirm substitution.');
    });

    it('returns error state when team does not exist in match', () => {
      const state = buildState();
      const useCases = new TeamUseCases(state);
      const matchId = state.championshipContainer.playableChampionship.matchContainer.rounds[0]
        .matches[0].id;

      const nextState = useCases.substitutePlayer(
        matchId,
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
      );

      expect(nextState.hasError).toBe(true);
      expect(nextState.errorMessage).toBe('Team could not be found to confirm substitution.');
    });
  });
});
