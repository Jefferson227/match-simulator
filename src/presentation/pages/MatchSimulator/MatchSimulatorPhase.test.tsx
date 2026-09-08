import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchSimulator from './MatchSimulator';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import { Championship } from '../../../domain/models/Championship';
import ChampionshipPhase from '../../../domain/models/ChampionshipPhase';
import Round from '../../../domain/models/Round';
import { Team } from '../../../domain/models/Team';

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
    championshipContainer: {
      playableChampionship: {
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
      } as Championship,
    },
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

  test('names the phase alongside the round for a phased championship', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState(true));
    render(<MatchSimulator />);

    expect(screen.getByText(/1ª Fase - ROUND 1 OF 1/)).toBeInTheDocument();
  });

  test('keeps the plain round line for an unphased championship', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState(false));
    render(<MatchSimulator />);

    expect(screen.getByText(/2026 - Round 1 of 1/)).toBeInTheDocument();
    expect(screen.queryByText(/Fase/)).not.toBeInTheDocument();
  });
});
