import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SeasonSummary from './SeasonSummary';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import {
  SeasonSummary as SeasonSummaryData,
  SeasonSummaryTeam,
} from '../../../domain/models/SeasonSummary';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockDispatch = jest.fn();

function buildTeam(abbreviation: string): SeasonSummaryTeam {
  return {
    id: abbreviation,
    shortName: `${abbreviation} Short`,
    abbreviation,
    colors: { outline: '#111111', background: '#222222', text: '#ffffff' },
  };
}

const summary: SeasonSummaryData = {
  season: 2031,
  divisions: [
    {
      divisionName: 'Upper Division',
      champion: buildTeam('UP1'),
      runnerUp: buildTeam('UP2'),
      // Top of the pyramid: its empty promotion is a result, not a gap.
      isPromotable: false,
      isRelegatable: true,
      otherPromotedTeams: [],
      relegatedTeams: [buildTeam('UP5'), buildTeam('UP6')],
    },
    {
      divisionName: 'Playable Division',
      champion: buildTeam('PL1'),
      runnerUp: buildTeam('PL2'),
      isPromotable: true,
      isRelegatable: true,
      otherPromotedTeams: [buildTeam('PL3')],
      relegatedTeams: [buildTeam('PL6')],
    },
    {
      divisionName: 'Lower Division',
      champion: buildTeam('LW1'),
      runnerUp: buildTeam('LW2'),
      // Relegates to a division outside the container, so its relegation is a gap, not a result.
      isPromotable: true,
      isRelegatable: true,
      otherPromotedTeams: [],
      relegatedTeams: undefined,
    },
  ],
};

function buildState(overrides?: Partial<GameState>): GameState {
  return {
    coachName: '',
    championshipContainer: {} as GameState['championshipContainer'],
    hasError: false,
    errorMessage: '',
    currentScreen: 'SeasonSummary',
    gameConfig: { clockSpeed: 1 },
    leagueType: 'mens',
    seasonSummary: summary,
    ...overrides,
  } as GameState;
}

beforeEach(() => {
  mockDispatch.mockClear();
  (useGameEngine as jest.Mock).mockReturnValue({ dispatch: mockDispatch });
  (useGameState as jest.Mock).mockReturnValue(buildState());
});

describe('SeasonSummary', () => {
  it('opens on the first division and pages through the rest', () => {
    render(<SeasonSummary />);

    expect(screen.getByText('Upper Division')).toBeInTheDocument();
    expect(screen.getByText('2031')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Playable Division')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Lower Division')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Playable Division')).toBeInTheDocument();
  });

  it('shows the champion, runner-up and both exchange lists of the division on screen', () => {
    render(<SeasonSummary />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('PL1 Short')).toBeInTheDocument();
    expect(screen.getByText('PL2 Short')).toBeInTheDocument();
    expect(screen.getByText('PL3 Short')).toBeInTheDocument();
    expect(screen.getByText('PL6 Short')).toBeInTheDocument();
  });

  it('tells an untracked exchange apart from the top and bottom of the pyramid', () => {
    render(<SeasonSummary />);

    // The top division promotes nowhere, and its relegation is tracked.
    expect(screen.getByText('seasonSummary.noPromotions')).toBeInTheDocument();
    expect(screen.queryByText('seasonSummary.notTracked')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // The lower division does have a division below it in reality, but the container never worked
    // its relegation out — so it says so rather than claiming it is the bottom of the pyramid.
    expect(screen.getByText('seasonSummary.notTracked')).toBeInTheDocument();
    expect(screen.queryByText('seasonSummary.noRelegations')).not.toBeInTheDocument();
    // It is promotable and nobody else went up beyond the top two.
    expect(screen.getByText('seasonSummary.nobodyElsePromoted')).toBeInTheDocument();
  });

  it('rolls the season over and returns to the team manager on new season', () => {
    render(<SeasonSummary />);

    fireEvent.click(screen.getByRole('button', { name: 'seasonSummary.newSeason' }));

    expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'RUN_END_OF_CHAMPIONSHIP_ACTIONS' });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'UPDATE_TEAM_STATS' });
    expect(mockDispatch).toHaveBeenNthCalledWith(3, {
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(4, { type: 'SAVE_GAME' });
  });

  it('renders without a summary on the state', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState({ seasonSummary: undefined }));

    render(<SeasonSummary />);

    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'seasonSummary.newSeason' })).toBeEnabled();
  });
});
