import { StrictMode } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamAssigner from './TeamAssigner';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'teamAssigner.assigningTeam': 'ASSIGNING TEAM',
        'teamAssigner.yourTeamIs': `${options?.coachName}, YOUR TEAM IS:`,
        'teamAssigner.startGame': 'START GAME',
      };
      return translations[key] ?? key;
    },
  }),
}));

const drawnTeam = {
  id: 'drawn-team-id',
  fullName: 'Sociedade Esportiva Gama',
  shortName: 'Gama',
  abbreviation: 'GAM',
  colors: {
    outline: '#00843d',
    background: '#ffffff',
    text: '#00843d',
  },
  players: [],
  morale: 50,
  isControlledByHuman: true,
};

const stateBeforeDraw = {
  championshipContainer: { playableChampionship: { teams: [] as (typeof drawnTeam)[] } },
  leagueType: 'mens',
  hasError: false,
  errorMessage: '',
  currentScreen: 'TeamAssigner',
  coachName: 'JEFFERSON',
};

const stateAfterDraw = {
  ...stateBeforeDraw,
  championshipContainer: {
    playableChampionship: {
      teams: [{ ...drawnTeam, id: 'other', isControlledByHuman: false }, drawnTeam],
    },
  },
};

/** An engine whose state becomes `resultOfDraw` once DRAW_TEAM_FOR_HUMAN_PLAYER is dispatched. */
let currentState: typeof stateBeforeDraw;
let resultOfDraw: typeof stateBeforeDraw;
const mockDispatch = jest.fn((action: { type: string }) => {
  if (action.type === 'DRAW_TEAM_FOR_HUMAN_PLAYER') currentState = resultOfDraw;
});
const mockEngine = { dispatch: mockDispatch };

const drawDispatches = () =>
  mockDispatch.mock.calls.filter(([action]) => action.type === 'DRAW_TEAM_FOR_HUMAN_PLAYER');

const advanceDots = (times: number) => {
  for (let index = 0; index < times; index++) {
    act(() => {
      jest.advanceTimersByTime(500);
    });
  }
};

describe('TeamAssigner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    currentState = stateBeforeDraw;
    resultOfDraw = stateAfterDraw;
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockImplementation(() => currentState);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the coach message and the start game button without a heading', () => {
    render(<TeamAssigner />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('JEFFERSON, YOUR TEAM IS:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'START GAME' })).toBeInTheDocument();
  });

  test('dispatches the draw exactly once on mount', () => {
    const { rerender } = render(<TeamAssigner />);

    rerender(<TeamAssigner />);
    advanceDots(3);
    rerender(<TeamAssigner />);

    expect(drawDispatches()).toHaveLength(1);
  });

  test('dispatches the draw once even when StrictMode runs effects twice', () => {
    render(
      <StrictMode>
        <TeamAssigner />
      </StrictMode>
    );

    expect(drawDispatches()).toHaveLength(1);
  });

  test('shows the loading dots one by one before revealing the team', () => {
    render(<TeamAssigner />);

    const loading = screen.getByRole('status');
    expect(loading).toHaveTextContent('');

    advanceDots(1);
    expect(screen.getByRole('status')).toHaveTextContent('.');

    advanceDots(1);
    expect(screen.getByRole('status')).toHaveTextContent('..');

    expect(screen.queryByTestId('drawn-team')).not.toBeInTheDocument();
  });

  test('reveals the drawn team after the three dots are shown', () => {
    render(<TeamAssigner />);

    advanceDots(3);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('drawn-team')).toHaveTextContent('Sociedade Esportiva Gama');
  });

  test('paints the drawn team rectangle with the team colors', () => {
    render(<TeamAssigner />);

    advanceDots(3);

    expect(screen.getByTestId('drawn-team')).toHaveStyle({
      borderColor: '#00843d',
      backgroundColor: '#ffffff',
      color: '#00843d',
    });
  });

  test('disables the start game button until the team is revealed', () => {
    render(<TeamAssigner />);

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled();

    advanceDots(3);

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeEnabled();
  });

  test('keeps the start game button disabled when no team was drawn', () => {
    resultOfDraw = { ...stateBeforeDraw, hasError: true, errorMessage: 'draw failed' };

    render(<TeamAssigner />);
    advanceDots(3);

    expect(screen.queryByTestId('drawn-team')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled();
  });

  test('navigates to TeamManager when start game is clicked', () => {
    render(<TeamAssigner />);

    advanceDots(3);
    fireEvent.click(screen.getByRole('button', { name: 'START GAME' }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamManager',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when the drawn team cannot be read', () => {
    // The draw "succeeded" but left no club flagged for the human.
    resultOfDraw = stateBeforeDraw;

    render(<TeamAssigner />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'Team controlled by human player could not be found.',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', () => {
    resultOfDraw = { ...stateBeforeDraw, hasError: true, errorMessage: 'state error' };

    render(<TeamAssigner />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'state error',
    });
  });
});
