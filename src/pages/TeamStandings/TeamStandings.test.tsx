import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamStandings from './TeamStandings';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import { Championship } from '../../../core/models/Championship';
import Standing from '../../../core/models/Standing';
import { Team } from '../../../core/models/Team';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

const mockDispatch = jest.fn();

function buildTeam(id: Team['id'], abbreviation: string): Team {
  return {
    id,
    fullName: abbreviation,
    shortName: abbreviation,
    abbreviation,
    colors: {
      outline: '#111111',
      background: '#222222',
      text: '#ffffff',
    },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function buildStanding(position: number, team: Team, points: number): Standing {
  return {
    team,
    position,
    wins: points / 3,
    draws: 0,
    losses: 0,
    goalsFor: position,
    goalsAgainst: 0,
    points,
  };
}

function buildState(overrides?: Partial<GameState>): GameState {
  const teamA = buildTeam('11111111-1111-1111-1111-111111111111', 'AAA');
  const teamB = buildTeam('22222222-2222-2222-2222-222222222222', 'BBB');

  return {
    championshipContainer: {
      playableChampionship: {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Mock Championship',
        internalName: 'mock-championship',
        numberOfTeams: 2,
        teams: [teamA, teamB],
        standings: [buildStanding(1, teamA, 6), buildStanding(2, teamB, 3)],
        matchContainer: {
          timer: 0,
          currentSeason: 2026,
          currentRound: 2,
          totalRounds: 3,
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
    currentScreen: 'TeamStandings',
    gameConfig: {
      clockSpeed: 1000,
    },
    ...overrides,
  };
}

describe('TeamStandings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: mockDispatch });
    (useGameState as jest.Mock).mockReturnValue(buildState());
  });

  test('renders standings from game state', () => {
    render(<TeamStandings />);

    expect(screen.getByText('Mock Championship')).toBeInTheDocument();
    expect(screen.getByText('AAA')).toBeInTheDocument();
    expect(screen.getByText('BBB')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('dispatches save game after continuing a regular season', () => {
    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'UPDATE_TEAM_STATS',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, { type: 'SAVE_GAME' });
  });

  test('runs end-of-championship actions before saving on new season', () => {
    (useGameState as jest.Mock).mockReturnValue(
      buildState({
        championshipContainer: {
          playableChampionship: {
            ...buildState().championshipContainer.playableChampionship,
            matchContainer: {
              ...buildState().championshipContainer.playableChampionship.matchContainer,
              currentRound: 4,
              totalRounds: 3,
            },
          } as Championship,
        },
      })
    );

    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: /new season/i }));

    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'RUN_END_OF_CHAMPIONSHIP_ACTIONS' });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'UPDATE_TEAM_STATS',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, { type: 'SAVE_GAME' });
  });
});
