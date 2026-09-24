import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchSimulator from './MatchSimulator';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import { Championship } from '../../../domain/models/Championship';
import ChampionshipPhase from '../../../domain/models/ChampionshipPhase';
import Round from '../../../domain/models/Round';
import { Team } from '../../../domain/models/Team';
import { containerOf } from '../../../../tests/support/containerOf';
import { getPlayableChampionship } from '../../../domain/features/pyramid/Pyramid';

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
  const abbreviation = `T${index}`;
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

const teams = [1, 2].map(buildTeam);

const firstPhase: ChampionshipPhase = {
  kind: 'round-robin',
  name: '1ª Fase',
  numberOfGroups: 1,
  teamsPerGroup: 2,
  legs: 1,
  advancingPerGroup: 2,
};

function buildRound(phased: boolean): Round {
  return {
    id: 'round-1',
    number: 1,
    status: 'in-progress',
    ...(phased ? { phaseIndex: 0, phaseName: '1ª Fase' } : {}),
    matches: [
      {
        id: 'match-1',
        homeTeam: teams[0],
        awayTeam: teams[1],
        homeTeamScore: 0,
        awayTeamScore: 0,
        scorers: [],
        ...(phased ? { phaseIndex: 0 } : {}),
      },
    ],
  };
}

function buildState(phased: boolean): GameState {
  return {
    coachName: '',
    championshipContainer: containerOf({
      id: 'championship',
      name: 'Mock Championship',
      internalName: 'mock',
      numberOfTeams: 2,
      teams,
      standings: [],
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 1,
        totalRounds: 1,
        rounds: [buildRound(phased)],
      },
      type: phased ? 'single-round-robin' : 'double-round-robin',
      leagueType: phased ? 'womens' : 'mens',
      hasTeamControlledByHuman: false,
      isPromotable: false,
      isRelegatable: false,
      ...(phased ? { phases: [firstPhase], currentPhaseIndex: 0 } : {}),
    } as Championship),
    hasError: false,
    errorMessage: '',
    leagueType: phased ? 'womens' : 'mens',
    currentScreen: 'MatchSimulator',
    gameConfig: { clockSpeed: 1000 },
  };
}

describe('MatchSimulator — phase label', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: jest.fn() });
  });

  test('shows the phase on one line and the round within it on the next for a phased championship', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState(true));
    render(<MatchSimulator />);

    expect(screen.getByText(/^2026 - 1ª Fase$/)).toBeInTheDocument();
    expect(screen.getByText(/^ROUND 1 OF 1$/)).toBeInTheDocument();
  });

  test('keeps the plain round line for an unphased championship', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState(false));
    render(<MatchSimulator />);

    expect(screen.getByText(/^2026 - ROUND 1 OF 1$/)).toBeInTheDocument();
    expect(screen.queryByText(/Fase/)).not.toBeInTheDocument();
  });
});

describe('MatchSimulator — group stage', () => {
  const groupTeams = [1, 2, 3, 4].map(buildTeam);

  const groupPhase: ChampionshipPhase = {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 2,
    teamsPerGroup: 2,
    legs: 1,
    advancingPerGroup: 1,
  };

  function buildGroupStageState(humanTeamIndex?: number): GameState {
    const state = buildState(true);
    const championship = getPlayableChampionship(state.championshipContainer);
    const matchOf = (home: Team, away: Team, group: number) => ({
      id: `match-${home.id}-${away.id}`,
      homeTeam: home,
      awayTeam: away,
      homeTeamScore: 0,
      awayTeamScore: 0,
      scorers: [],
      phaseIndex: 0,
      group,
    });

    return {
      ...state,
      championshipContainer: containerOf({
        ...championship,
        numberOfTeams: 4,
        teams: groupTeams.map((team, index) =>
          index === humanTeamIndex ? { ...team, isControlledByHuman: true } : team
        ),
        standings: groupTeams.map((team, index) => ({
          team,
          position: index + 1,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        })),
        matchContainer: {
          ...championship.matchContainer,
          rounds: [
            {
              ...buildRound(true),
              matches: [
                matchOf(groupTeams[0], groupTeams[1], 0),
                matchOf(groupTeams[2], groupTeams[3], 1),
              ].map((match) =>
                humanTeamIndex === undefined
                  ? match
                  : {
                      ...match,
                      homeTeam:
                        match.homeTeam.id === groupTeams[humanTeamIndex].id
                          ? { ...match.homeTeam, isControlledByHuman: true }
                          : match.homeTeam,
                      awayTeam:
                        match.awayTeam.id === groupTeams[humanTeamIndex].id
                          ? { ...match.awayTeam, isControlledByHuman: true }
                          : match.awayTeam,
                    }
              ),
            },
          ],
        },
        phases: [groupPhase],
      } as Championship),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: jest.fn() });
  });

  test('shows one group per page, with the group in the title', () => {
    (useGameState as jest.Mock).mockReturnValue(buildGroupStageState());
    render(<MatchSimulator />);

    expect(screen.getByText(/^2026 - 1ª Fase - GROUP 1$/)).toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.queryByText('T3')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('>'));

    expect(screen.getByText(/^2026 - 1ª Fase - GROUP 2$/)).toBeInTheDocument();
    expect(screen.getByText('T3')).toBeInTheDocument();
    expect(screen.queryByText('T1')).not.toBeInTheDocument();
  });

  test("opens on the group of the human's team", () => {
    (useGameState as jest.Mock).mockReturnValue(buildGroupStageState(3));
    render(<MatchSimulator />);

    expect(screen.getByText(/^2026 - 1ª Fase - GROUP 2$/)).toBeInTheDocument();
    expect(screen.getByText('T4')).toBeInTheDocument();
    expect(screen.queryByText('T1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('<'));

    expect(screen.getByText(/^2026 - 1ª Fase - GROUP 1$/)).toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();
  });
});

describe('MatchSimulator — knockout phase', () => {
  const knockoutPhase: ChampionshipPhase = {
    kind: 'knockout',
    name: 'Oitavas de final',
    numberOfTies: 8,
    legs: 1,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
  };

  /** Eight ties of one leg, paging seven matches at a time, with one club given to the human. */
  function buildKnockoutState(humanTeamIndex: number): GameState {
    const knockoutTeams = Array.from({ length: 16 }, (_, index) => buildTeam(index + 1)).map(
      (team, index) => (index === humanTeamIndex ? { ...team, isControlledByHuman: true } : team)
    );

    const state = buildState(true);
    const championship = getPlayableChampionship(state.championshipContainer);

    return {
      ...state,
      championshipContainer: containerOf({
        ...championship,
        numberOfTeams: 16,
        teams: knockoutTeams,
        standings: [],
        matchContainer: {
          ...championship.matchContainer,
          rounds: [
            {
              id: 'round-1',
              number: 1,
              status: 'in-progress',
              phaseIndex: 0,
              phaseName: knockoutPhase.name,
              matches: Array.from({ length: 8 }, (_, tie) => ({
                id: `match-tie-${tie}`,
                homeTeam: knockoutTeams[tie * 2],
                awayTeam: knockoutTeams[tie * 2 + 1],
                homeTeamScore: 0,
                awayTeamScore: 0,
                scorers: [],
                phaseIndex: 0,
                tieId: `p0-t${tie}`,
                leg: 1,
              })),
            },
          ],
        },
        phases: [knockoutPhase],
      } as Championship),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: jest.fn() });
  });

  test("opens on the page holding the human's tie", () => {
    // The eighth tie is T15 x T16, the only one on the second page; the human runs T15.
    (useGameState as jest.Mock).mockReturnValue(buildKnockoutState(14));
    render(<MatchSimulator />);

    expect(screen.getByText('T15')).toBeInTheDocument();
    expect(screen.queryByText('T1')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('<'));

    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.queryByText('T15')).not.toBeInTheDocument();
  });

  test('stays on the first page when the human club is not in the phase', () => {
    (useGameState as jest.Mock).mockReturnValue(buildKnockoutState(-1));
    render(<MatchSimulator />);

    expect(screen.getByText('T1')).toBeInTheDocument();
    expect(screen.queryByText('T15')).not.toBeInTheDocument();
  });
});

describe('MatchSimulator — a semifinal hosting a playoff (Série D 2026)', () => {
  const semifinal: ChampionshipPhase = {
    kind: 'knockout',
    name: 'Semifinal',
    numberOfTies: 2,
    legs: 1,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
    playoff: {
      name: 'Playoffs',
      from: 'previous-phase-losers',
      pairs: [
        [1, 4],
        [2, 3],
      ],
      secondLegHost: 'higher-seed',
      tiebreakers: ['goal-difference', 'seed'],
    },
  };

  /** Two semifinals and two playoff ties in the same round; the human runs `humanTeamIndex`. */
  function buildPlayoffState(humanTeamIndex: number): GameState {
    const clubs = Array.from({ length: 8 }, (_, index) => buildTeam(index + 1)).map(
      (team, index) => (index === humanTeamIndex ? { ...team, isControlledByHuman: true } : team)
    );
    const state = buildState(true);
    const championship = getPlayableChampionship(state.championshipContainer);
    const match = (tie: number, playoff: boolean) => ({
      id: `match-${playoff ? 'playoff' : 'semi'}-${tie}`,
      homeTeam: clubs[(playoff ? 4 : 0) + tie * 2],
      awayTeam: clubs[(playoff ? 4 : 0) + tie * 2 + 1],
      homeTeamScore: 0,
      awayTeamScore: 0,
      scorers: [],
      phaseIndex: 0,
      tieId: playoff ? `p0-playoff-t${tie}` : `p0-t${tie}`,
      leg: 1,
      ...(playoff && { bracket: 'playoff' as const }),
    });

    return {
      ...state,
      championshipContainer: containerOf({
        ...championship,
        numberOfTeams: 8,
        teams: clubs,
        standings: [],
        matchContainer: {
          ...championship.matchContainer,
          rounds: [
            {
              id: 'round-1',
              number: 1,
              status: 'in-progress',
              phaseIndex: 0,
              phaseName: semifinal.name,
              matches: [match(0, false), match(1, false), match(0, true), match(1, true)],
            },
          ],
        },
        phases: [semifinal],
      } as Championship),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue({ dispatch: jest.fn() });
  });

  test('pages the playoff apart from the semifinals, under its own label', () => {
    (useGameState as jest.Mock).mockReturnValue(buildPlayoffState(-1));
    render(<MatchSimulator />);

    expect(screen.getByText(/Semifinal/)).toBeInTheDocument();
    expect(screen.queryByText('T5')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('>'));

    expect(screen.getByText(/PROMOTION PLAYOFF/)).toBeInTheDocument();
    expect(screen.getByText('T5')).toBeInTheDocument();
    expect(screen.queryByText('T1')).not.toBeInTheDocument();
  });

  test("opens on the playoff page when the human's club plays it", () => {
    (useGameState as jest.Mock).mockReturnValue(buildPlayoffState(6));
    render(<MatchSimulator />);

    expect(screen.getByText(/PROMOTION PLAYOFF/)).toBeInTheDocument();
    expect(screen.getByText('T7')).toBeInTheDocument();
  });
});
