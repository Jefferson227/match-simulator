import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeagueTypeSelector from './LeagueTypeSelector';
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
        'leagueTypeSelector.selectLeagueType': 'SELECT LEAGUE TYPE',
        'leagueTypeSelector.womensLeague': "WOMEN'S LEAGUE",
        'leagueTypeSelector.mensLeague': "MEN'S LEAGUE",
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
  currentScreen: 'LeagueTypeSelector',
};

describe('LeagueTypeSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
  });

  test('renders the heading and both league buttons', () => {
    render(<LeagueTypeSelector />);

    expect(screen.getByText('SELECT LEAGUE TYPE')).toBeInTheDocument();
    expect(screen.getByText("WOMEN'S LEAGUE")).toBeInTheDocument();
    expect(screen.getByText("MEN'S LEAGUE")).toBeInTheDocument();
  });

  test("dispatches SET_LEAGUE_TYPE with 'womens' and navigates when the women's button is clicked", () => {
    render(<LeagueTypeSelector />);

    fireEvent.click(screen.getByText("WOMEN'S LEAGUE"));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LEAGUE_TYPE',
      leagueType: 'womens',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'CoachCreator',
    });
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  test("dispatches SET_LEAGUE_TYPE with 'mens' and navigates when the men's button is clicked", () => {
    render(<LeagueTypeSelector />);

    fireEvent.click(screen.getByText("MEN'S LEAGUE"));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_LEAGUE_TYPE',
      leagueType: 'mens',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'CoachCreator',
    });
    expect(mockDispatch).toHaveBeenCalledTimes(2);
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', () => {
    (useGameState as jest.Mock).mockReturnValue({
      ...mockGameState,
      hasError: true,
      errorMessage: 'state error',
    });

    render(<LeagueTypeSelector />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'state error',
    });
  });
});
