import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialScreen from './InitialScreen';
import { GeneralContext } from '../../contexts/GeneralContext';

const mockSetScreenDisplayed = jest.fn();

const mockGeneralContextValue = {
  setScreenDisplayed: mockSetScreenDisplayed,
  state: {
    currentPage: 1,
    baseTeam: {},
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'InitialScreen',
  },
  setCurrentPage: jest.fn(),
  getBaseTeam: jest.fn(),
  setMatchTeam: jest.fn(),
  setMatchOtherTeams: jest.fn(),
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <GeneralContext.Provider value={mockGeneralContextValue as any}>
      {component}
    </GeneralContext.Provider>
  );
};

describe('InitialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all main elements', () => {
    renderWithContext(<InitialScreen />);

    // Test that the pixelated logo containers are rendered
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();

    // Test that the buttons are rendered
    expect(
      screen.getByRole('button', { name: /new game/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /load game/i })
    ).toBeInTheDocument();

    // Test that the developer info is rendered
    expect(screen.getByText(/developed by/i)).toBeInTheDocument();
    expect(screen.getByText(/jefferson227/i)).toBeInTheDocument();
  });

  test('renders pixelated logo with correct structure', () => {
    renderWithContext(<InitialScreen />);

    // Check that the main logo container exists
    const logoContainer = screen.getByTestId('logo-container');
    expect(logoContainer).toBeInTheDocument();

    // Check that both word containers exist
    const winningContainer = screen.getByTestId('winning-container');
    const pixelsContainer = screen.getByTestId('pixels-container');
    expect(winningContainer).toBeInTheDocument();
    expect(pixelsContainer).toBeInTheDocument();
  });

  test('calls setScreenDisplayed with "TeamManager" when New Game button is clicked', () => {
    renderWithContext(<InitialScreen />);

    const newGameButton = screen.getByRole('button', { name: /new game/i });
    fireEvent.click(newGameButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
  });

  test('Load Game button is present', () => {
    renderWithContext(<InitialScreen />);

    const loadGameButton = screen.getByRole('button', { name: /load game/i });
    expect(loadGameButton).toBeInTheDocument();
  });
});
