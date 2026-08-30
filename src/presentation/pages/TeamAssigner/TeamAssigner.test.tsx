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

const mockDispatch = jest.fn();
const mockEngine = { dispatch: mockDispatch };
const mockGameState = {
  championshipContainer: {},
  leagueType: 'mens',
  hasError: false,
  errorMessage: '',
  currentScreen: 'TeamAssigner',
  coachName: 'JEFFERSON',
};

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
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
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
    expect(screen.getByTestId('drawn-team')).toHaveTextContent('Amazonas Futebol Clube');
  });

  test('paints the drawn team rectangle with the team colors', () => {
    render(<TeamAssigner />);

    advanceDots(3);

    expect(screen.getByTestId('drawn-team')).toHaveStyle({
      borderColor: '#fbab2c',
      backgroundColor: '#05030e',
      color: '#fbab2c',
    });
  });

  test('disables the start game button until the team is revealed', () => {
    render(<TeamAssigner />);

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled();

    advanceDots(3);

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeEnabled();
  });

  test('navigates to ChampionshipSelector when start game is clicked', () => {
    render(<TeamAssigner />);

    advanceDots(3);
    fireEvent.click(screen.getByRole('button', { name: 'START GAME' }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'ChampionshipSelector',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', () => {
    (useGameState as jest.Mock).mockReturnValue({
      ...mockGameState,
      hasError: true,
      errorMessage: 'state error',
    });

    render(<TeamAssigner />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'state error',
    });
  });
});
