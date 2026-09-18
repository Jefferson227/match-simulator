import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SeasonSummary from './SeasonSummary';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { GameState } from '../../../game-engine/GameState';
import {
  SeasonSummary as SeasonSummaryData,
  SeasonSummaryDivision,
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

/** One page of the summary, top of the pyramid down to the bottom. */
function buildDivision(
  prefix: string,
  overrides: Partial<SeasonSummaryDivision> = {}
): SeasonSummaryDivision {
  return {
    divisionName: `Division ${prefix}`,
    champion: buildTeam(`${prefix}1`),
    runnerUp: buildTeam(`${prefix}2`),
    isPromotable: true,
    isRelegatable: true,
    isHumanDivision: false,
    otherPromotedTeams: [],
    relegatedTeams: [buildTeam(`${prefix}9`)],
    ...overrides,
  };
}

/** A men's pyramid, A to D, with the human in Série D — the page opens on the last division. */
const summary: SeasonSummaryData = {
  season: 2031,
  divisions: [
    // Top of the pyramid: its empty promotion is a result.
    buildDivision('A', { isPromotable: false }),
    buildDivision('B', { otherPromotedTeams: [buildTeam('B3')] }),
    buildDivision('C'),
    // Bottom of the pyramid, and the human's division.
    buildDivision('D', { isRelegatable: false, relegatedTeams: [], isHumanDivision: true }),
  ],
};

/** A women's pyramid, A1 to A3, with the human in A2. */
const womensSummary: SeasonSummaryData = {
  season: 2031,
  divisions: [
    buildDivision('A1', { isPromotable: false }),
    buildDivision('A2', { isHumanDivision: true }),
    buildDivision('A3', { isRelegatable: false, relegatedTeams: [] }),
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
  it('opens on the human’s division and pages up through the pyramid in tier order', () => {
    render(<SeasonSummary />);

    expect(screen.getByText('Division D')).toBeInTheDocument();
    expect(screen.getByText('2031')).toBeInTheDocument();
    expect(screen.getByText('4 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pagination.next' })).toBeDisabled();

    for (const name of ['Division C', 'Division B', 'Division A']) {
      fireEvent.click(screen.getByRole('button', { name: 'pagination.previous' }));
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pagination.previous' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'pagination.next' }));
    expect(screen.getByText('Division B')).toBeInTheDocument();
  });

  it('opens a three-tier women’s pyramid on the human’s middle division', () => {
    (useGameState as jest.Mock).mockReturnValue(buildState({ seasonSummary: womensSummary }));

    render(<SeasonSummary />);

    expect(screen.getByText('Division A2')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('falls back to the top division when no division is flagged as the human’s', () => {
    (useGameState as jest.Mock).mockReturnValue(
      buildState({
        seasonSummary: {
          ...summary,
          divisions: summary.divisions.map((division) => ({
            ...division,
            isHumanDivision: false,
          })),
        },
      })
    );

    render(<SeasonSummary />);

    expect(screen.getByText('Division A')).toBeInTheDocument();
    expect(screen.getByText('1 / 4')).toBeInTheDocument();
  });

  it('shows the champion, runner-up and both exchange lists of the division on screen', () => {
    render(<SeasonSummary />);
    fireEvent.click(screen.getByRole('button', { name: 'pagination.previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'pagination.previous' }));

    expect(screen.getByText('Division B')).toBeInTheDocument();
    expect(screen.getByText('B1 Short')).toBeInTheDocument();
    expect(screen.getByText('B2 Short')).toBeInTheDocument();
    expect(screen.getByText('B3 Short')).toBeInTheDocument();
    expect(screen.getByText('B9 Short')).toBeInTheDocument();
  });

  it('labels the ends of the pyramid and an empty exchange, and never an untracked one', () => {
    render(<SeasonSummary />);

    // Série D, the bottom: nobody else promoted, and no division to relegate into.
    expect(screen.getByText('seasonSummary.nobodyElsePromoted')).toBeInTheDocument();
    expect(screen.getByText('seasonSummary.noRelegations')).toBeInTheDocument();
    expect(screen.queryByText('seasonSummary.notTracked')).not.toBeInTheDocument();

    for (let page = 0; page < 3; page++) {
      fireEvent.click(screen.getByRole('button', { name: 'pagination.previous' }));
    }

    // Série A, the top: no division to promote into.
    expect(screen.getByText('seasonSummary.noPromotions')).toBeInTheDocument();
    expect(screen.queryByText('seasonSummary.notTracked')).not.toBeInTheDocument();
  });

  it('still says a champion is not known when a division produced no table', () => {
    (useGameState as jest.Mock).mockReturnValue(
      buildState({
        seasonSummary: {
          season: 2031,
          divisions: [
            buildDivision('X', { champion: undefined, runnerUp: undefined, isHumanDivision: true }),
          ],
        },
      })
    );

    render(<SeasonSummary />);

    expect(screen.getAllByText('seasonSummary.notTracked')).toHaveLength(2);
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
