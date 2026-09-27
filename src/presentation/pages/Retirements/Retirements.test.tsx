import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Retirements from './Retirements';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import Player from '../../../domain/models/Player';
import RetiredPlayer from '../../../domain/models/RetiredPlayer';
import RetirementReport from '../../../domain/models/RetirementReport';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { age?: number; context?: string }) => {
      if (options?.age !== undefined) return `(${options.age})`;
      return options?.context ? `${key}_${options.context}` : key;
    },
  }),
}));

const mockDispatch = jest.fn();

function retired(name: string, age: number, position: Player['position']): RetiredPlayer {
  return {
    id: `${name}-a-b-c-d`,
    position,
    name,
    strength: 60,
    age,
    nationalities: ['BRA'],
    xp: 0,
    isRetired: true,
    retiredInSeason: 2026,
    lastTeamId: 'h-u-m-a-n',
    lastTeamShortName: 'Human',
  };
}

function youth(name: string, age: number, position: Player['position']): Player {
  return {
    id: `${name}-y-o-u-t`,
    position,
    name,
    strength: 40,
    age,
    nationalities: ['BRA'],
    xp: 0,
    isStarter: false,
    isSub: false,
  };
}

const report: RetirementReport = {
  season: 2026,
  teamId: 'h-u-m-a-n',
  entries: [
    {
      retired: retired('Old Keeper', 39, 'GK'),
      replacement: youth('Kid Keeper', 18, 'GK'),
      becameCoach: false,
    },
    {
      retired: retired('Old Striker', 36, 'FW'),
      replacement: youth('Kid Striker', 17, 'FW'),
      becameCoach: true,
    },
  ],
};

function buildState(overrides?: Partial<GameState>): GameState {
  return {
    coachName: '',
    championshipContainer: {} as GameState['championshipContainer'],
    hasError: false,
    errorMessage: '',
    currentScreen: 'Retirements',
    gameConfig: { clockSpeed: 1 },
    leagueType: 'mens',
    coachPool: [],
    retiredPlayers: [],
    retiredCoaches: [],
    lastSeasonRetirements: report,
    ...overrides,
  };
}

beforeEach(() => {
  mockDispatch.mockClear();
  jest
    .mocked(useGameEngine)
    .mockReturnValue({ dispatch: mockDispatch } as unknown as ReturnType<typeof useGameEngine>);
  jest.mocked(useGameState).mockReturnValue(buildState());
});

describe('Retirements', () => {
  it('shows the title and the season that just ended', () => {
    render(<Retirements />);

    expect(screen.getByText('retirements.title')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('renders every retirement with position, names and ages', () => {
    render(<Retirements />);

    const entries = screen.getAllByTestId('retirement-entry');
    expect(entries).toHaveLength(2);

    expect(entries[0].textContent).toContain('teamPlayers.positions.GK');
    expect(entries[0].textContent).toContain('Old Keeper (39)');
    expect(entries[0].textContent).toContain('Kid Keeper (18)');
    expect(entries[1].textContent).toContain('teamPlayers.positions.FW');
    expect(entries[1].textContent).toContain('Old Striker (36)');
    expect(entries[1].textContent).toContain('Kid Striker (17)');
  });

  it('marks only the retirees who became coaches', () => {
    render(<Retirements />);

    const entries = screen.getAllByTestId('retirement-entry');
    expect(entries[0].textContent).not.toContain('retirements.becameCoach');
    expect(entries[1].textContent).toContain('retirements.becameCoach');
    expect(screen.getAllByText('retirements.becameCoach')).toHaveLength(1);
  });

  it('uses the feminine coach label in the women’s game', () => {
    jest.mocked(useGameState).mockReturnValue(buildState({ leagueType: 'womens' }));

    render(<Retirements />);

    expect(screen.getByText('retirements.becameCoach_female')).toBeTruthy();
  });

  it('goes to TeamManager on CONTINUE', () => {
    render(<Retirements />);

    fireEvent.click(screen.getByRole('button', { name: 'retirements.continue' }));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  });

  it('renders without a report', () => {
    jest.mocked(useGameState).mockReturnValue(buildState({ lastSeasonRetirements: undefined }));

    render(<Retirements />);

    expect(screen.queryAllByTestId('retirement-entry')).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: 'retirements.continue' }).hasAttribute('disabled')
    ).toBe(false);
  });
});
