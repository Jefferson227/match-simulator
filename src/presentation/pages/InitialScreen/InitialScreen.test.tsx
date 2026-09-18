import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InitialScreen from './InitialScreen';
import i18n from '../../../i18n';
import { useGameEngine } from '../../contexts/GameEngineContext';
import GameService from '~domain/services/GameService';
import OperationResult from '~domain/results/OperationResult';
import { GameState } from '~game-engine/GameState';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('~domain/services/GameService', () => ({
  __esModule: true,
  default: {
    hasSavedGame: jest.fn(),
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

function loadFailureResult(message: string): OperationResult<GameState> {
  const result = new OperationResult<GameState>({} as GameState);
  result.setError({ errorCode: 'exception', message });
  return result;
}

/** MS-108: the screen probes for a save instead of loading one. */
function probeResult(exists: boolean): OperationResult<boolean> {
  const result = new OperationResult<boolean>(exists);
  result.setSuccess();
  return result;
}

function probeFailureResult(message: string): OperationResult<boolean> {
  const result = new OperationResult<boolean>(false);
  result.setError({ errorCode: 'exception', message });
  return result;
}

describe('InitialScreen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    mockedGameService.loadGame.mockReturnValue(loadFailureResult('No saved game'));
    mockedGameService.hasSavedGame.mockReturnValue(probeResult(false));
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
    mockedGameService.hasSavedGame.mockReturnValue(probeResult(true));

    render(<InitialScreen />);

    expect(screen.getByRole('button', { name: /load game/i })).toBeInTheDocument();
  });

  test('dispatches set current screen when new game button is clicked', () => {
    render(<InitialScreen />);

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_CURRENT_SCREEN',
      screenName: 'LeagueTypeSelector',
    });
  });

  test('dispatches load game when load game button is clicked', () => {
    mockedGameService.hasSavedGame.mockReturnValue(probeResult(true));

    render(<InitialScreen />);

    fireEvent.click(screen.getByRole('button', { name: /load game/i }));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_GAME' });
  });

  test('does not load the game just to decide whether to offer continue', () => {
    mockedGameService.hasSavedGame.mockReturnValue(probeResult(true));

    render(<InitialScreen />);

    expect(mockedGameService.hasSavedGame).toHaveBeenCalled();
    expect(mockedGameService.loadGame).not.toHaveBeenCalled();
  });

  test('hides load game when the probe itself fails', () => {
    mockedGameService.hasSavedGame.mockReturnValue(probeFailureResult('localStorage unavailable'));

    render(<InitialScreen />);

    expect(screen.queryByRole('button', { name: /load game/i })).toBeNull();
  });

  test('renders the menu and build label in Brazilian Portuguese', async () => {
    mockedGameService.hasSavedGame.mockReturnValue(probeResult(true));
    await i18n.changeLanguage('pt-BR');

    render(<InitialScreen />);

    expect(screen.getByRole('button', { name: 'Novo Jogo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Carregar Jogo' })).toBeTruthy();
    expect(screen.getByText('VERSÃO')).toBeTruthy();
  });
});
