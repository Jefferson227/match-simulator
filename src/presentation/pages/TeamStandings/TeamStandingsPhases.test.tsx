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

/** The final's two legs, generated but not played yet. */
function unplayedFinal(firstRoundNumber: number, home: Team, away: Team): Round[] {
  return [1, 2].map((leg) => ({
    id: `round-${firstRoundNumber + leg - 1}`,
    number: firstRoundNumber + leg - 1,
    status: 'not-started',
    phaseIndex: 1,
    phaseName: 'Final',
    matches: [
      buildMatch({
        homeTeam: leg === 1 ? home : away,
        awayTeam: leg === 1 ? away : home,
        phaseIndex: 1,
        tieId: 'p1-t0',
        leg,
      }),
    ],
  }));
}

/** The group stage has just ended: the final is generated and the standings reset to its field. */
function groupStageJustEndedState(): GameState {
  const state = groupStageState();
  const championship = state.championshipContainer.playableChampionship;
  const groupRound = championship.matchContainer.rounds[0];

  return buildState({
    teams,
    phases: [groupPhase, knockoutPhase],
    currentPhaseIndex: 1,
    survivingTeamIds: [teams[0].id, teams[2].id],
    phaseStandings: [championship.standings],
    standings: [buildStanding(teams[0], 1, 0), buildStanding(teams[2], 2, 0)],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 2,
      totalRounds: 3,
      rounds: [groupRound, ...unplayedFinal(2, teams[0], teams[2])],
    },
  });
}

const semiFinalPhase: ChampionshipPhase = { ...knockoutPhase, name: 'Semifinal', numberOfTies: 2 };

/** Both semi-final legs are played — the first ends goalless — and the final is generated. */
function semiFinalJustEndedState(): GameState {
  const semiFinalLeg = (number: number, leg: number, scores: [number, number][]): Round => ({
    id: `round-${number}`,
    number,
    status: 'ended',
    phaseIndex: 0,
    phaseName: 'Semifinal',
    matches: [
      [teams[0], teams[1]],
      [teams[2], teams[3]],
    ].map(([home, away], tie) =>
      buildMatch({
        homeTeam: leg === 1 ? home : away,
        awayTeam: leg === 1 ? away : home,
        phaseIndex: 0,
        tieId: `p0-t${tie}`,
        leg,
        homeTeamScore: scores[tie][0],
        awayTeamScore: scores[tie][1],
      })
    ),
  });

  return buildState({
    teams,
    phases: [semiFinalPhase, knockoutPhase],
    currentPhaseIndex: 1,
    survivingTeamIds: [teams[0].id, teams[2].id],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 3,
      totalRounds: 4,
      rounds: [
        semiFinalLeg(1, 1, [
          [0, 0],
          [0, 0],
        ]),
        semiFinalLeg(2, 2, [
          [0, 1],
          [0, 2],
        ]),
        ...unplayedFinal(3, teams[0], teams[2]),
      ],
    },
  });
}

/** A knockout phase of `tieCount` ties, two legs each, none played yet. */
function wideKnockoutState(tieCount: number): GameState {
  const knockoutTeams = Array.from({ length: tieCount * 2 }, (_, index) => buildTeam(index + 1));
  const rounds: Round[] = [1, 2].map((leg) => ({
    id: `round-${leg}`,
    number: leg,
    status: 'not-started',
    phaseIndex: 1,
    phaseName: 'Final',
    matches: Array.from({ length: tieCount }, (_, tie) => {
      const home = knockoutTeams[tie * 2];
      const away = knockoutTeams[tie * 2 + 1];
      return buildMatch({
        homeTeam: leg === 1 ? home : away,
        awayTeam: leg === 1 ? away : home,
        phaseIndex: 1,
        tieId: `p1-t${tie}`,
        leg,
      });
    }),
  }));

  return buildState({
    teams: knockoutTeams,
    phases: [groupPhase, { ...knockoutPhase, numberOfTies: tieCount }],
    currentPhaseIndex: 1,
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 2,
      rounds,
    },
  });
}

/** The same state, with one club handed to the human player. */
function withHumanTeam(state: GameState, humanTeam: Team): GameState {
  const championship = state.championshipContainer.playableChampionship;
  championship.teams = championship.teams.map((team) =>
    team.id === humanTeam.id ? { ...team, isControlledByHuman: true } : team
  );
  championship.hasTeamControlledByHuman = true;
  return state;
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

  test("opens on the group of the human's club", () => {
    // The human runs T03, in group 2.
    (useGameState as jest.Mock).mockReturnValue(withHumanTeam(groupStageState(), teams[2]));
    render(<TeamStandings />);

    expect(screen.getByText(/GROUP 2/)).toBeInTheDocument();
    expect(screen.getByText('T03')).toBeInTheDocument();
    expect(screen.queryByText('T01')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText(/GROUP 1/)).toBeInTheDocument();
    expect(screen.getByText('T01')).toBeInTheDocument();
  });

  test('pages to the next group', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageState());
    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/GROUP 2/)).toBeInTheDocument();
    expect(screen.getByText('T03')).toBeInTheDocument();
    expect(screen.queryByText('T01')).not.toBeInTheDocument();
  });

  test("opens on the page holding the human's tie during a knockout", () => {
    // Eight ties page four at a time; the human runs T15, in the last tie of the second page.
    const state = wideKnockoutState(8);
    const humanTeam = state.championshipContainer.playableChampionship.teams[14];
    (useGameState as jest.Mock).mockReturnValue(withHumanTeam(state, humanTeam));
    render(<TeamStandings />);

    expect(screen.getByText('T15')).toBeInTheDocument();
    expect(screen.queryByText('T01')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.queryByText('T15')).not.toBeInTheDocument();
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

  test('shows a goalless leg as 0 x 0, not as a leg still to be played', () => {
    (useGameState as jest.Mock).mockReturnValue(semiFinalJustEndedState());
    render(<TeamStandings />);

    const legs = screen.getAllByTestId('tie-leg');
    expect(legs[0]).toHaveTextContent('LEG 1 OF 2 0 x 0');
    expect(legs[2]).toHaveTextContent('LEG 1 OF 2 0 x 0');
  });

  test('shows the results of a knockout phase just ended, not the next phase draw', () => {
    (useGameState as jest.Mock).mockReturnValue(semiFinalJustEndedState());
    render(<TeamStandings />);

    expect(screen.getByText(/Semifinal/)).toBeInTheDocument();
    expect(screen.queryByText(/^Final$/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('tie')).toHaveLength(2);

    // T01 won its second leg 1-0 away, T03 won 2-0 away; both advance in yellow.
    const aggregates = screen.getAllByTestId('tie-aggregate');
    expect(aggregates[0]).toHaveTextContent('T01 1 x 0 T02');
    expect(aggregates[1]).toHaveTextContent('T03 2 x 0 T04');
    const legs = screen.getAllByTestId('tie-leg');
    expect(legs[1]).toHaveTextContent('LEG 2 OF 2 1 x 0');
    expect(legs[3]).toHaveTextContent('LEG 2 OF 2 2 x 0');
    for (const home of screen.getAllByTestId('tie-aggregate-home')) {
      expect(home).toHaveClass('text-yellow-300');
    }
  });

  test('shows the final group tables of a group stage just ended', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageJustEndedState());
    render(<TeamStandings />);

    expect(screen.getByText(/1ª Fase/)).toBeInTheDocument();
    expect(screen.queryByTestId('phase-bracket')).not.toBeInTheDocument();
    expect(screen.getByText(/GROUP 1/)).toBeInTheDocument();
    expect(screen.getByText('T01')).toBeInTheDocument();
    expect(screen.getByText('T02')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText(/GROUP 2/)).toBeInTheDocument();
    expect(screen.getByText('T04')).toBeInTheDocument();
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

describe('TeamStandings — continuing between phases', () => {
  const dispatch = jest.fn();
  const continueButton = () => screen.getByRole('button', { name: /continue/i });

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch });
  });

  test('shows the next knockout phase draw after the results of the phase just ended', () => {
    (useGameState as jest.Mock).mockReturnValue(semiFinalJustEndedState());
    render(<TeamStandings />);

    expect(screen.getByText('2026 - Semifinal')).toBeInTheDocument();

    fireEvent.click(continueButton());

    expect(dispatch).not.toHaveBeenCalled();
    // The phase the draw opens, not the phase last played.
    expect(screen.getByText('2026 - Final')).toBeInTheDocument();
    expect(screen.queryByText(/Semifinal/)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('tie')).toHaveLength(1);
    expect(screen.getByTestId('tie-aggregate')).toHaveTextContent('T01 0 x 0 T03');
    const legs = screen.getAllByTestId('tie-leg');
    expect(legs[0]).toHaveTextContent('LEG 1 OF 2 - x -');
    expect(legs[1]).toHaveTextContent('LEG 2 OF 2 - x -');
  });

  test('shows the knockout draw after the final tables of a group stage just ended', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageJustEndedState());
    render(<TeamStandings />);

    fireEvent.click(continueButton());

    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.queryByText(/GROUP/)).not.toBeInTheDocument();
    expect(screen.getByTestId('phase-bracket')).toBeInTheDocument();
    expect(screen.getByTestId('tie-aggregate')).toHaveTextContent('T01 0 x 0 T03');
  });

  test('goes back to the first page of the next phase draw', () => {
    (useGameState as jest.Mock).mockReturnValue(groupStageJustEndedState());
    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(continueButton());

    expect(screen.getByTestId('tie-aggregate')).toHaveTextContent('T01 0 x 0 T03');
  });

  test('goes to the team manager and saves once the next phase draw has been seen', () => {
    (useGameState as jest.Mock).mockReturnValue(semiFinalJustEndedState());
    render(<TeamStandings />);

    fireEvent.click(continueButton());
    fireEvent.click(continueButton());

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'UPDATE_TEAM_STATS' });
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
    expect(dispatch).toHaveBeenNthCalledWith(3, { type: 'SAVE_GAME' });
  });

  test('goes straight to the team manager in the middle of a phase', () => {
    (useGameState as jest.Mock).mockReturnValue(knockoutState(false));
    render(<TeamStandings />);

    fireEvent.click(continueButton());

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  });

  test('skips the team manager when the human club is not in the knockout about to be played', () => {
    // The final is T01 x T03; the human runs T02, knocked out in the semi-final.
    (useGameState as jest.Mock).mockReturnValue(withHumanTeam(semiFinalJustEndedState(), teams[1]));
    render(<TeamStandings />);

    fireEvent.click(continueButton());
    fireEvent.click(continueButton());

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'UPDATE_TEAM_STATS' });
    expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'PREPARE_TEAMS_BEFORE_MATCH' });
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'MatchSimulator',
    });
    expect(dispatch).toHaveBeenNthCalledWith(4, { type: 'SAVE_GAME' });
  });

  test('keeps the team manager when the human club is still in the knockout', () => {
    (useGameState as jest.Mock).mockReturnValue(withHumanTeam(semiFinalJustEndedState(), teams[0]));
    render(<TeamStandings />);

    fireEvent.click(continueButton());
    fireEvent.click(continueButton());

    expect(dispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'PREPARE_TEAMS_BEFORE_MATCH' });
  });

  test('keeps the team manager once the season is over, whoever the human club is', () => {
    const state = withHumanTeam(knockoutState(true), teams[1]);
    const championship = state.championshipContainer.playableChampionship;
    championship.matchContainer = { ...championship.matchContainer, currentRound: 4 };
    (useGameState as jest.Mock).mockReturnValue(state);
    render(<TeamStandings />);

    fireEvent.click(screen.getByRole('button', { name: /new season/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  });

  test('ends the championship and goes to the team manager once the final is played', () => {
    const state = knockoutState(true);
    const championship = state.championshipContainer.playableChampionship;
    championship.matchContainer = { ...championship.matchContainer, currentRound: 4 };
    (useGameState as jest.Mock).mockReturnValue(state);
    render(<TeamStandings />);

    expect(screen.getByText('2026 - Final')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /new season/i }));

    expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'RUN_END_OF_CHAMPIONSHIP_ACTIONS' });
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  });
});
