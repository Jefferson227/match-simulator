import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Retirements from './Retirements';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import Player from '../../../domain/models/Player';
import RetiredPlayer from '../../../domain/models/RetiredPlayer';
import RetirementReport from '../../../domain/models/RetirementReport';
import RetiredCoach from '../../../domain/models/RetiredCoach';
import { Championship } from '../../../domain/models/Championship';

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
    expect(entries[0].textContent).toContain('Old Keeper(39)');
    expect(entries[0].textContent).toContain('Kid Keeper(18)');
    expect(entries[1].textContent).toContain('teamPlayers.positions.FW');
    expect(entries[1].textContent).toContain('Old Striker(36)');
    expect(entries[1].textContent).toContain('Kid Striker(17)');
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

  describe('league-wide pages', () => {
    const container = {
      championships: [
        {
          internalName: 'top',
          name: 'Top Division',
          teams: [],
        },
        {
          internalName: 'bottom',
          name: 'Bottom Division',
          teams: [{ id: 'h-u-m-a-n', shortName: 'Human FC', players: [] }],
        },
      ] as unknown as Championship[],
      playableInternalName: 'bottom',
    };

    const leagueRetiree = (name: string, division: string, becameCoach = false): RetiredPlayer => ({
      ...retired(name, 37, 'DF'),
      lastTeamShortName: 'Rival FC',
      lastChampionshipInternalName: division,
      becameCoach,
    });

    const coach = (name: string, club?: string, division?: string): RetiredCoach => ({
      name,
      age: 70,
      isRetired: true,
      retiredInSeason: 2026,
      ...(club && { lastTeamId: 'r-i-v-a-l', lastTeamShortName: club }),
      ...(division && { lastChampionshipInternalName: division }),
    });

    const leagueState = (overrides?: Partial<GameState>) =>
      buildState({
        championshipContainer: container as unknown as GameState['championshipContainer'],
        retiredPlayers: [
          leagueRetiree('Top Veteran', 'top', true),
          leagueRetiree('Bottom Veteran', 'bottom'),
          { ...leagueRetiree('Last Year', 'top'), retiredInSeason: 2025 },
        ],
        retiredCoaches: [coach('Club Coach', 'Rival FC', 'top'), coach('Pool Coach')],
        ...overrides,
      });

    const heading = () => screen.getByTestId('retirements-page-heading').textContent;
    const next = () => fireEvent.click(screen.getByRole('button', { name: 'pagination.next' }));

    it('opens on the human club, then pages through every division and the coach pool', () => {
      jest.mocked(useGameState).mockReturnValue(leagueState());
      render(<Retirements />);

      expect(heading()).toBe('Human FC');
      expect(screen.getByText('1 / 4')).toBeTruthy();

      next();
      expect(heading()).toBe('Top Division');
      expect(screen.getAllByTestId('league-retired-player').map((row) => row.textContent)).toEqual([
        expect.stringContaining('Top Veteran'),
      ]);
      expect(screen.getByTestId('league-retired-player').textContent).toContain('Rival FC');
      expect(screen.getByTestId('league-retired-player').textContent).toContain(
        'retirements.becameCoach'
      );
      expect(screen.getByTestId('league-retired-coach').textContent).toContain('Club Coach');

      next();
      expect(heading()).toBe('Bottom Division');
      expect(screen.getByTestId('league-retired-player').textContent).toContain('Bottom Veteran');
      expect(screen.getByTestId('league-retired-player').textContent).not.toContain(
        'retirements.becameCoach'
      );
      expect(screen.queryAllByTestId('league-retired-coach')).toHaveLength(0);

      next();
      expect(heading()).toBe('retirements.coachPool');
      expect(screen.getByTestId('league-retired-coach').textContent).toContain('Pool Coach');
      expect(screen.getByRole('button', { name: 'pagination.next' }).hasAttribute('disabled')).toBe(
        true
      );
    });

    it('says nobody retired on a division page with no retirees', () => {
      jest
        .mocked(useGameState)
        .mockReturnValue(leagueState({ retiredPlayers: [], retiredCoaches: [] }));
      render(<Retirements />);

      next();
      expect(heading()).toBe('Top Division');
      expect(screen.getByText('retirements.nobodyRetired')).toBeTruthy();
      expect(screen.getByText('2 / 3')).toBeTruthy();
    });

    it('says nobody retired on the club page when the club lost nobody', () => {
      jest.mocked(useGameState).mockReturnValue(
        leagueState({
          lastSeasonRetirements: { season: 2026, teamId: 'h-u-m-a-n', entries: [] },
        })
      );
      render(<Retirements />);

      expect(heading()).toBe('Human FC');
      expect(screen.getByText('retirements.nobodyRetired')).toBeTruthy();
      expect(screen.queryAllByTestId('retirement-entry')).toHaveLength(0);
    });

    it('gives retirees with no recorded division a page of their own', () => {
      const { lastChampionshipInternalName, ...early } = leagueRetiree('Early', 'top');
      jest
        .mocked(useGameState)
        .mockReturnValue(
          leagueState({ retiredPlayers: [early as RetiredPlayer], retiredCoaches: [] })
        );
      render(<Retirements />);

      next();
      next();
      next();
      expect(heading()).toBe('retirements.divisionNotRecorded');
      expect(screen.getByTestId('league-retired-player').textContent).toContain('Early');
      expect(lastChampionshipInternalName).toBe('top');
    });
  });
});
