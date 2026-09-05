/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamManager from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GameEngineProvider, useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import type { GameState } from '../../../game-engine/GameState';
import type { Championship } from '../../../domain/models/Championship';
import type { Team } from '../../../domain/models/Team';
import type Player from '../../../domain/models/Player';
import type Round from '../../../domain/models/Round';
import type Standing from '../../../domain/models/Standing';

const makePlayer = (id: string, name: string, position: Player['position'], strength: number) => ({
  id: id as Player['id'],
  name,
  position,
  strength,
  xp: 0,
  isStarter: false,
  isSub: false,
});

const basePlayers: Player[] = [
  makePlayer('p-1-1-1-1', 'Player 1', 'GK', 80),
  makePlayer('p-2-2-2-2', 'Player 2', 'DF', 75),
  makePlayer('p-3-3-3-3', 'Player 3', 'DF', 78),
  makePlayer('p-4-4-4-4', 'Player 4', 'DF', 72),
  makePlayer('p-5-5-5-5', 'Player 5', 'DF', 76),
  makePlayer('p-6-6-6-6', 'Player 6', 'MF', 82),
  makePlayer('p-7-7-7-7', 'Player 7', 'MF', 79),
  makePlayer('p-8-8-8-8', 'Player 8', 'MF', 81),
  makePlayer('p-9-9-9-9', 'Player 9', 'MF', 77),
  makePlayer('p-10-10-10-10', 'Player 10', 'FW', 85),
  makePlayer('p-11-11-11-11', 'Player 11', 'FW', 83),
  makePlayer('p-12-12-12-12', 'Player 12', 'FW', 80),
];

const createTeam = (players: Player[], overrides: Partial<Team> = {}): Team => ({
  id: 'team-1-1-1-1' as Team['id'],
  fullName: 'Test Team',
  shortName: 'TEST',
  abbreviation: 'TST',
  colors: {
    outline: '#000',
    background: '#fff',
    text: '#000',
  },
  players,
  morale: 100,
  isControlledByHuman: true,
  ...overrides,
});

const createOpponent = (): Team =>
  createTeam([], {
    id: 'team-2-2-2-2' as Team['id'],
    fullName: 'Novorizontino FC',
    shortName: 'Novorizontino',
    abbreviation: 'NOV',
    isControlledByHuman: false,
  });

const createStandings = (teams: Team[]): Standing[] =>
  teams.map((team, index) => ({
    team,
    position: index + 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));

const createChampionship = (teams: Team[], rounds: Round[], standings: Standing[]): Championship =>
  ({
    id: 'championship-1',
    name: 'Série B',
    internalName: 'test-championship',
    numberOfTeams: teams.length,
    teams,
    standings,
    matchContainer: {
      timer: 0,
      currentSeason: 2024,
      currentRound: 13,
      totalRounds: 38,
      rounds,
    },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: true,
    isPromotable: false,
    isRelegatable: false,
  }) as Championship;

const createState = (teams: Team[], rounds: Round[] = [], standings: Standing[] = []): GameState =>
  ({
    championshipContainer: {
      playableChampionship: createChampionship(teams, rounds, standings),
    },
    hasError: false,
    errorMessage: '',
    leagueType: 'mens',
    coachName: '',
    currentScreen: 'TeamManager',
    gameConfig: {
      clockSpeed: 1000,
    },
  }) as GameState;

const renderTeamManager = (teams: Team[], rounds: Round[] = [], standings: Standing[] = []) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider initialState={createState(teams, rounds, standings)}>
        <TeamManager />
      </GameEngineProvider>
    </I18nextProvider>
  );

describe('TeamManager', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  it('renders the team name in the header', () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    const teamNameElement = screen.getByText(team.fullName);
    expect(teamNameElement).toBeTruthy();
    expect(teamNameElement.className).toContain('uppercase');
  });

  it('renders the championship position and the current round', () => {
    const team = createTeam(basePlayers);
    const standings = createStandings([team]);
    renderTeamManager([team], [], standings);

    expect(screen.getByText('Série B')).toBeTruthy();
    expect(screen.getByText(/POSITION: 1st/)).toBeTruthy();
    expect(screen.getByText(/ROUND 13 OF 38/)).toBeTruthy();
  });

  it('renders the next opponent with its position', () => {
    const team = createTeam(basePlayers);
    const opponent = createOpponent();
    const rounds: Round[] = [
      {
        id: 'round-13',
        number: 13,
        status: 'not-started',
        matches: [
          {
            id: 'match-1',
            homeTeam: team,
            homeTeamScore: 0,
            awayTeam: opponent,
            awayTeamScore: 0,
            scorers: [],
          },
        ],
      } as Round,
    ];
    const standings = createStandings([team, opponent]);

    renderTeamManager([team, opponent], rounds, standings);

    expect(screen.getByText(/NEXT MATCH: Novorizontino - 2nd/)).toBeTruthy();
  });

  it('renders the morale progress bar and the budget', () => {
    const team = createTeam(basePlayers, { morale: 75 });
    renderTeamManager([team]);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByText(/BUDGET: R\$ 12.6M/)).toBeTruthy();
  });

  it('renders the action buttons and no squad list', () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    ['START MATCH', 'STADIUM', 'MARKET', 'STATS', 'CONTRACTS', 'CALENDAR', 'CAMPAIGNS'].forEach(
      (label) => expect(screen.getByText(label)).toBeTruthy()
    );

    expect(screen.queryByText('CHOOSE FORMATION')).toBeNull();
    expect(screen.queryByText('MORE INFO')).toBeNull();
    expect(screen.queryByText('<')).toBeNull();
    expect(screen.queryByText('>')).toBeNull();
    expect(screen.queryByText('Player 1')).toBeNull();
  });

  it('picks the best lineup and navigates to the match when Start Match is clicked', () => {
    const team = createTeam(basePlayers);
    const opponent = createOpponent();
    const rounds: Round[] = [
      {
        id: 'round-13',
        number: 13,
        status: 'not-started',
        matches: [
          {
            id: 'match-1',
            homeTeam: team,
            homeTeamScore: 0,
            awayTeam: opponent,
            awayTeamScore: 0,
            scorers: [],
          },
        ],
      } as Round,
    ];

    const CurrentScreen: React.FC = () => {
      const engine = useGameEngine();
      const state = useGameState(engine);
      return <div data-testid="current-screen">{state.currentScreen}</div>;
    };

    render(
      <I18nextProvider i18n={i18n}>
        <GameEngineProvider initialState={createState([team, opponent], rounds)}>
          <TeamManager />
          <CurrentScreen />
        </GameEngineProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByText('START MATCH'));

    expect(screen.getByTestId('current-screen').textContent).toBe('MatchSimulator');

    const starters = team.players.filter((player) => player.isStarter);
    expect(starters.length).toBe(0); // the original array stays untouched
  });
});
