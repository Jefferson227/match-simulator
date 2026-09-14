import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamStandings from './TeamStandings';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import { Championship } from '../../../domain/models/Championship';
import ChampionshipPhase from '../../../domain/models/ChampionshipPhase';
import Match from '../../../domain/models/Match';
import Round from '../../../domain/models/Round';
import Standing from '../../../domain/models/Standing';
import { Team } from '../../../domain/models/Team';

// react-i18next is not initialised under test. Resolve keys against the real en.json so these
// assertions also prove every new string exists in the locale file.
jest.mock('react-i18next', () => {
  const en = jest.requireActual('../../locales/en.json') as Record<string, Record<string, string>>;
  return {
    useTranslation: () => ({
      t: (key: string, options?: Record<string, string | number>) => {
        const [namespace, name] = key.split('.');
        const template = en[namespace]?.[name];
        if (!template) return key;
        return template.replace(/\{\{(\w+)\}\}/g, (_, token) => String(options?.[token] ?? ''));
      },
    }),
  };
});

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

function buildTeam(index: number): Team {
  const abbreviation = `T${String(index).padStart(2, '0')}`;
  return {
    id: `team-${index}` as Team['id'],
    fullName: abbreviation,
    shortName: abbreviation,
    abbreviation,
    colors: { outline: '#111111', background: '#222222', text: '#ffffff' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function buildStanding(team: Team, position: number, points: number): Standing {
  return {
    team,
    position,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: points,
    goalsAgainst: 0,
    points,
  };
}

function buildMatch(fields: Partial<Match> & { homeTeam: Team; awayTeam: Team }): Match {
  return {
    id: `match-${fields.homeTeam.id}-${fields.awayTeam.id}-${fields.leg ?? 1}`,
    homeTeamScore: 0,
    awayTeamScore: 0,
    scorers: [],
    ...fields,
  };
}

function buildState(championship: Partial<Championship>): GameState {
  return {
    coachName: '',
    championshipContainer: {
      playableChampionship: {
        id: 'championship',
        name: 'Mock Championship',
        internalName: 'mock',
        numberOfTeams: 4,
        teams: [],
        standings: [],
        matchContainer: {
          timer: 0,
          currentSeason: 2026,
          currentRound: 1,
          totalRounds: 6,
          rounds: [],
        },
        type: 'group-stage-knockout',
        leagueType: 'womens',
        hasTeamControlledByHuman: false,
        isPromotable: false,
        isRelegatable: false,
        ...championship,
      } as Championship,
    },
    hasError: false,
    errorMessage: '',
    leagueType: 'womens',
    currentScreen: 'TeamStandings',
    gameConfig: { clockSpeed: 1000 },
  };
}

const groupPhase: ChampionshipPhase = {
  kind: 'round-robin',
  name: '1ª Fase',
  numberOfGroups: 2,
  teamsPerGroup: 2,
  legs: 1,
  advancingPerGroup: 1,
};

const knockoutPhase: ChampionshipPhase = {
  kind: 'knockout',
  name: 'Final',
  numberOfTies: 1,
  legs: 2,
  secondLegHost: 'accumulated-points',
  tiebreakers: ['goal-difference', 'penalties'],
};

const teams = [1, 2, 3, 4].map(buildTeam);

function groupStageState(): GameState {
  const round: Round = {
    id: 'round-1',
    number: 1,
    status: 'ended',
    phaseIndex: 0,
    phaseName: '1ª Fase',
    matches: [
      buildMatch({ homeTeam: teams[0], awayTeam: teams[1], phaseIndex: 0, group: 0 }),
      buildMatch({ homeTeam: teams[2], awayTeam: teams[3], phaseIndex: 0, group: 1 }),
    ],
  };

  return buildState({
    teams,
    phases: [groupPhase, knockoutPhase],
    currentPhaseIndex: 0,
    standings: [
      buildStanding(teams[0], 1, 9),
      buildStanding(teams[1], 2, 6),
      buildStanding(teams[2], 3, 4),
      buildStanding(teams[3], 4, 1),
    ],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 1,
      rounds: [round],
    },
  });
}

function knockoutState(withShootout: boolean): GameState {
  const firstLeg: Round = {
    id: 'round-2',
    number: 2,
    status: 'ended',
    phaseIndex: 1,
    phaseName: 'Final',
    matches: [
      buildMatch({
        homeTeam: teams[0],
        awayTeam: teams[2],
        phaseIndex: 1,
        tieId: 'p1-t0',
        leg: 1,
        homeTeamScore: 1,
        awayTeamScore: 2,
      }),
    ],
  };

  const secondLeg: Round = {
    id: 'round-3',
    number: 3,
    status: 'ended',
    phaseIndex: 1,
    phaseName: 'Final',
    matches: [
      buildMatch({
        homeTeam: teams[2],
        awayTeam: teams[0],
        phaseIndex: 1,
        tieId: 'p1-t0',
        leg: 2,
        homeTeamScore: 0,
        awayTeamScore: 1,
        ...(withShootout ? { penaltyShootout: { homeScore: 4, awayScore: 2, kicks: [] } } : {}),
      }),
    ],
  };

  return buildState({
    teams,
    phases: [groupPhase, knockoutPhase],
    currentPhaseIndex: 1,
    survivingTeamIds: [teams[2].id],
    standings: [buildStanding(teams[0], 1, 0), buildStanding(teams[2], 2, 0)],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 3,
      totalRounds: 3,
      rounds: [firstLeg, secondLeg],
    },
  });
}

describe('TeamStandings — phased championships', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: jest.fn() });
  });

  test('names the phase being played', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageState());
    render(<TeamStandings />);

    expect(screen.getByText(/1ª Fase/)).toBeInTheDocument();
  });

  test('renders one table per group during a group stage', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageState());
    render(<TeamStandings />);

    // The first group's page shows only its own two clubs.
    expect(screen.getByText(/GROUP 1/)).toBeInTheDocument();
    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.getByText('T02')).toBeInTheDocument();
    expect(screen.queryByText('T03')).not.toBeInTheDocument();
    expect(screen.queryByText('T04')).not.toBeInTheDocument();
  });

  test('pages to the next group', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageState());
    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/GROUP 2/)).toBeInTheDocument();
    expect(screen.getByText('T03')).toBeInTheDocument();
    expect(screen.queryByText('T01')).not.toBeInTheDocument();
  });

  test('renders a bracket during a knockout phase, with both legs and the aggregate', () => {
    (useGameState as jest.Mock).mockReturnValue(knockoutState(false));
    render(<TeamStandings />);

    expect(screen.getByTestId('phase-bracket')).toBeInTheDocument();
    expect(screen.getAllByTestId('tie')).toHaveLength(1);
    // T01 hosted the first leg and lost it 1-2, then won the second 1-0 away: 2-2 on aggregate.
    expect(screen.getByTestId('tie-aggregate')).toHaveTextContent('T01 2 x 2 T03');

    // Every row reads in the tie's order, so the second leg's score is flipped to T01-first.
    const legs = screen.getAllByTestId('tie-leg');
    expect(legs[0]).toHaveTextContent('LEG 1 OF 2 1 x 2');
    expect(legs[1]).toHaveTextContent('LEG 2 OF 2 1 x 0');
    expect(screen.queryByTestId('tie-shootout')).not.toBeInTheDocument();
  });

  test('shows the shootout in the tie order when a tie needed one', () => {
    (useGameState as jest.Mock).mockReturnValue(knockoutState(true));
    render(<TeamStandings />);

    // The shootout was taken at the second leg, hosted by T03, who scored 4.
    expect(screen.getByTestId('tie-shootout')).toHaveTextContent('PENALTIES 2 x 4');
  });

  test('paints the advancing club scores yellow', () => {
    (useGameState as jest.Mock).mockReturnValue(knockoutState(true));
    render(<TeamStandings />);

    expect(screen.getByTestId('tie-aggregate-away')).toHaveClass('text-yellow-300');
    expect(screen.getByTestId('tie-aggregate-home')).not.toHaveClass('text-yellow-300');
    expect(screen.getByTestId('tie-shootout-away')).toHaveClass('text-yellow-300');
    expect(screen.getByTestId('tie-shootout-home')).not.toHaveClass('text-yellow-300');
    expect(screen.queryByText(/ADVANCES/)).not.toBeInTheDocument();
  });

  test('renders a single table and no bracket for an unphased championship', () => {
    (useGameState as jest.Mock).mockReturnValue(
      buildState({
        teams,
        type: 'double-round-robin',
        standings: teams.map((team, index) => buildStanding(team, index + 1, 10 - index)),
      })
    );
    render(<TeamStandings />);

    expect(screen.queryByTestId('phase-bracket')).not.toBeInTheDocument();
    expect(screen.queryByText(/GROUP/)).not.toBeInTheDocument();
    for (const team of teams) expect(screen.getByText(team.abbreviation)).toBeInTheDocument();
  });
});
