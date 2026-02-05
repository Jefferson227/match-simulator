import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChampionshipSelector from './ChampionshipSelector';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { getChampionships } from '../../../use-cases/ChampionshipUseCases';

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('../../../use-cases/ChampionshipUseCases', () => ({
  getChampionships: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'championshipSelector.selectChampionship') {
        return 'SELECT CHAMPIONSHIP';
      }
      return key;
    },
  }),
}));

const mockDispatch = jest.fn();
const mockEngine = { dispatch: mockDispatch };
const mockGameState = {
  championshipContainer: {},
  hasError: false,
  errorMessage: '',
  currentScreen: 'ChampionshipSelector',
};

const championshipsFixture = [
  { id: '1', name: 'BRASILEIRÃO SÉRIE A', internalName: 'brasileirao-serie-a' },
  { id: '2', name: 'BRASILEIRÃO SÉRIE B', internalName: 'brasileirao-serie-b' },
  { id: '3', name: 'BRASILEIRÃO SÉRIE C', internalName: 'brasileirao-serie-c' },
  { id: '4', name: 'BRASILEIRÃO SÉRIE D', internalName: 'brasileirao-serie-d' },
  { id: '5', name: 'PREMIER LEAGUE', internalName: 'premier-league' },
  { id: '6', name: 'BUNDESLIGA', internalName: 'bundesliga' },
  { id: '7', name: 'LA LIGA', internalName: 'la-liga' },
  { id: '8', name: 'SERIE A', internalName: 'serie-a' },
  { id: '9', name: 'LIGUE 1', internalName: 'ligue-1' },
];

const mockSuccessfulResult = {
  succeeded: true,
  getResult: () => championshipsFixture,
};

const mockErrorResult = {
  succeeded: false,
  error: { message: 'load failed' },
  getResult: () => [],
};

describe('ChampionshipSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
    (getChampionships as jest.Mock).mockReturnValue(mockSuccessfulResult);
  });

  test('renders the component and initial championships', () => {
    render(<ChampionshipSelector />);

    expect(screen.getByText('SELECT CHAMPIONSHIP')).toBeInTheDocument();

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.getByText('BUNDESLIGA')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });

  test('previous button is disabled on the first page', () => {
    render(<ChampionshipSelector />);
    const prevButton = screen.getByText('<');
    expect(prevButton).toBeDisabled();
  });

  test('next button is enabled on the first page', () => {
    render(<ChampionshipSelector />);
    const nextButton = screen.getByText('>');
    expect(nextButton).not.toBeDisabled();
  });

  test('paginates to the next page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('BRASILEIRÃO SÉRIE A')).not.toBeInTheDocument();
    expect(screen.getByText('LA LIGA')).toBeInTheDocument();
    expect(screen.getByText('LIGUE 1')).toBeInTheDocument();
  });

  test('next button is disabled on the last page', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Click to go to the last page

    expect(nextButton).toBeDisabled();
  });

  test('paginates to the previous page of championships', () => {
    render(<ChampionshipSelector />);

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Go to next page

    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton); // Go back to previous page

    expect(screen.getByText('BRASILEIRÃO SÉRIE A')).toBeInTheDocument();
    expect(screen.queryByText('LA LIGA')).not.toBeInTheDocument();
  });

  test('dispatches INIT_CHAMPIONSHIPS when a championship button is clicked', () => {
    render(<ChampionshipSelector />);

    const serieAButton = screen.getByText('BRASILEIRÃO SÉRIE A');
    fireEvent.click(serieAButton);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'INIT_CHAMPIONSHIPS',
      championshipInternalName: 'brasileirao-serie-a',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when getChampionships fails', () => {
    (getChampionships as jest.Mock).mockReturnValue(mockErrorResult);

    render(<ChampionshipSelector />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'load failed',
    });
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', () => {
    (useGameState as jest.Mock).mockReturnValue({
      ...mockGameState,
      hasError: true,
      errorMessage: 'state error',
    });

    render(<ChampionshipSelector />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_ERROR_MESSAGE',
      errorMessage: 'state error',
    });
  });
});
