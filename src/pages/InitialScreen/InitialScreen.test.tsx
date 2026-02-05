import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialScreen from './InitialScreen';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('../../assets/build-version.json', () => ({
  buildVersion: 'TEST_BUILD',
}));

const mockDispatch = jest.fn();
const mockEngine = { dispatch: mockDispatch };
const mockGameState = {
  championshipContainer: {},
  hasError: false,
  errorMessage: '',
  currentScreen: 'InitialScreen',
};

describe('InitialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
  });

  test('renders all main elements', async () => {
    render(<InitialScreen />);

    // Test that the pixelated logo containers are rendered
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();

    // Test that the buttons are rendered
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test game engine/i })).toBeInTheDocument();

    // Test that the build info is rendered
    expect(screen.getByText(/build version/i)).toBeInTheDocument();
    expect(await screen.findByText('TEST_BUILD')).toBeInTheDocument();
  });

  test('renders pixelated logo with correct structure', () => {
    render(<InitialScreen />);

    // Check that the main logo container exists
    const logoContainer = screen.getByTestId('logo-container');
    expect(logoContainer).toBeInTheDocument();

    // Check that both word containers exist
    const winningContainer = screen.getByTestId('winning-container');
    const pixelsContainer = screen.getByTestId('pixels-container');
    expect(winningContainer).toBeInTheDocument();
    expect(pixelsContainer).toBeInTheDocument();
  });

  test('dispatches "SET_CURRENT_SCREEN" when New Game button is clicked', () => {
    render(<InitialScreen />);

    const newGameButton = screen.getByRole('button', { name: /new game/i });
    fireEvent.click(newGameButton);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'ChampionshipSelector',
    });
  });

  test('dispatches "PING" when Test Game Engine button is clicked', () => {
    render(<InitialScreen />);

    const testGameEngineButton = screen.getByRole('button', { name: /test game engine/i });
    fireEvent.click(testGameEngineButton);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'PING' });
  });
});
