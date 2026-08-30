import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoachCreator from './CoachCreator';
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
    t: (key: string) => {
      const translations: Record<string, string> = {
        'coachCreator.insertYourName': 'INSERT YOUR NAME',
        'coachCreator.startGame': 'START GAME',
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
  currentScreen: 'CoachCreator',
};

describe('CoachCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
  });

  test('renders the heading, the textbox and the start game button', () => {
    render(<CoachCreator />);

    expect(screen.getByRole('heading', { name: 'INSERT YOUR NAME' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'INSERT YOUR NAME' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'START GAME' })).toBeInTheDocument();
  });

  test('disables the start game button while the name is empty', () => {
    render(<CoachCreator />);

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox', { name: 'INSERT YOUR NAME' }), {
      target: { value: '   ' },
    });

    expect(screen.getByRole('button', { name: 'START GAME' })).toBeDisabled();
  });

  test('updates the textbox value as the user types', () => {
    render(<CoachCreator />);

    const input = screen.getByRole('textbox', { name: 'INSERT YOUR NAME' });
    fireEvent.change(input, { target: { value: 'JEFFERSON' } });

    expect(input).toHaveValue('JEFFERSON');
  });

  test('stores the coach name and navigates to TeamAssigner when start game is clicked', () => {
    render(<CoachCreator />);

    fireEvent.change(screen.getByRole('textbox', { name: 'INSERT YOUR NAME' }), {
      target: { value: 'JEFFERSON' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'START GAME' }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_COACH_NAME',
      coachName: 'JEFFERSON',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'TeamAssigner',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', () => {
    (useGameState as jest.Mock).mockReturnValue({
      ...mockGameState,
      hasError: true,
      errorMessage: 'state error',
    });

    render(<CoachCreator />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'state error',
    });
  });
});
