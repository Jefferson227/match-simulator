import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialScreen from './InitialScreen';
import { useGameEngine } from '../../contexts/GameEngineContext';
import GameService from '../../domain/services/GameService';
import OperationResult from '../../domain/results/OperationResult';
import { GameState } from '../../game-engine/GameState';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../domain/services/GameService', () => ({
  __esModule: true,
  default: {
    loadGame: jest.fn(),
    saveGame: jest.fn(),
  },
}));

jest.mock('../../assets/build-version.json', () => ({
  buildVersion: 'TEST_BUILD',
}));

const mockDispatch = jest.fn();
const mockEngine = { dispatch: mockDispatch };
const mockedGameService = GameService as jest.Mocked<typeof GameService>;

function loadSuccessResult(): OperationResult<GameState> {
  const result = new OperationResult<GameState>({} as GameState);
  result.setSuccess();
  return result;
}

function loadFailureResult(message: string): OperationResult<GameState> {
  const result = new OperationResult<GameState>({} as GameState);
  result.setError({ errorCode: 'exception', message });
  return result;
}

describe('InitialScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    mockedGameService.loadGame.mockReturnValue(loadFailureResult('No saved game'));
  });

  test('renders main elements and hides load game button when there is no save', async () => {
    render(<InitialScreen />);

    expect(screen.getByTestId('logo-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new game/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load game/i })).not.toBeInTheDocument();
    expect(screen.getByText(/build version/i)).toBeInTheDocument();
    expect(await screen.findByText('TEST_BUILD')).toBeInTheDocument();
  });

  test('renders load game button when there is a saved game', () => {
    mockedGameService.loadGame.mockReturnValue(loadSuccessResult());

    render(<InitialScreen />);

    expect(screen.getByRole('button', { name: /load game/i })).toBeInTheDocument();
  });

  test('dispatches set current screen when new game button is clicked', () => {
    render(<InitialScreen />);

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'ChampionshipSelector',
    });
  });

  test('dispatches load game when load game button is clicked', () => {
    mockedGameService.loadGame.mockReturnValue(loadSuccessResult());

    render(<InitialScreen />);

    fireEvent.click(screen.getByRole('button', { name: /load game/i }));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_GAME' });
  });
});
