import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSelector from './TeamSelector';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import TeamUseCases from '../../../use-cases/TeamUseCases';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'teamSelector.selectATeam') {
        return 'SELECT A TEAM';
      }
      return key;
    },
  }),
}));

jest.mock('../../contexts/GameEngineContext', () => ({
  useGameEngine: jest.fn(),
}));

jest.mock('../../../services/useGameState', () => ({
  useGameState: jest.fn(),
}));

jest.mock('../../../use-cases/TeamUseCases', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockEngine = { dispatch: mockDispatch };
const mockGameState = {
  championshipContainer: {
    playableChampionship: {
      id: 'championship-id',
    },
  },
  hasError: false,
  errorMessage: '',
  currentScreen: 'TeamSelector',
};

const teamsFixture = [
  {
    id: 'team-1',
    fullName: 'Team One',
    shortName: 'TEAM ONE',
    abbreviation: 'TO',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-2',
    fullName: 'Team Two',
    shortName: 'TEAM TWO',
    abbreviation: 'TT',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-3',
    fullName: 'Team Three',
    shortName: 'TEAM THREE',
    abbreviation: 'T3',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-4',
    fullName: 'Team Four',
    shortName: 'TEAM FOUR',
    abbreviation: 'T4',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-5',
    fullName: 'Team Five',
    shortName: 'TEAM FIVE',
    abbreviation: 'T5',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-6',
    fullName: 'Team Six',
    shortName: 'TEAM SIX',
    abbreviation: 'T6',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-7',
    fullName: 'Team Seven',
    shortName: 'TEAM SEVEN',
    abbreviation: 'T7',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-8',
    fullName: 'Team Eight',
    shortName: 'TEAM EIGHT',
    abbreviation: 'T8',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-9',
    fullName: 'Team Nine',
    shortName: 'TEAM NINE',
    abbreviation: 'T9',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
  {
    id: 'team-10',
    fullName: 'Team Ten',
    shortName: 'TEAM TEN',
    abbreviation: 'T10',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  },
];

const mockSuccessResult = {
  succeeded: true,
  getResult: () => teamsFixture,
};

const mockErrorResult = {
  succeeded: false,
  error: { message: 'Failed to load teams' },
  getResult: () => [],
};

describe('TeamSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useGameEngine as jest.Mock).mockReturnValue(mockEngine);
    (useGameState as jest.Mock).mockReturnValue(mockGameState);
    (TeamUseCases as jest.Mock).mockImplementation(() => ({
      getTeamsToSelect: jest.fn(() => teamsFixture),
    }));
  });

  test('renders the component and initial teams', async () => {
    render(<TeamSelector />);

    expect(screen.getByText('SELECT A TEAM')).toBeInTheDocument();
    expect(await screen.findByText('TEAM ONE')).toBeInTheDocument();
    expect(screen.getByText('TEAM NINE')).toBeInTheDocument();
    expect(screen.queryByText('TEAM TEN')).not.toBeInTheDocument();
  });

  test('paginates to the next page of teams', async () => {
    render(<TeamSelector />);

    await screen.findByText('TEAM ONE');

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('TEAM ONE')).not.toBeInTheDocument();
    expect(screen.getByText('TEAM TEN')).toBeInTheDocument();
  });

  test('dispatches SELECT_TEAM when a team is clicked', async () => {
    render(<TeamSelector />);

    await screen.findByText('TEAM ONE');

    fireEvent.click(screen.getByText('TEAM ONE'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SELECT_TEAM', teamId: 'team-1' });
  });

  test('dispatches SET_ERROR_MESSAGE when team loading fails', async () => {
    (TeamUseCases as jest.Mock).mockImplementation(() => ({
      getTeamsToSelect: jest.fn(() => {
        throw new Error('Failed to load teams');
      }),
    }));

    render(<TeamSelector />);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR_MESSAGE',
        errorMessage: 'Failed to load teams',
      });
    });
  });

  test('dispatches SET_ERROR_MESSAGE when state has an error', async () => {
    (useGameState as jest.Mock).mockReturnValue({
      ...mockGameState,
      hasError: true,
      errorMessage: 'state error',
    });
    (TeamUseCases as jest.Mock).mockImplementation(() => ({
      getTeamsToSelect: jest.fn(() => teamsFixture),
    }));

    render(<TeamSelector />);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_ERROR_MESSAGE',
        errorMessage: 'state error',
      });
    });
  });
});
