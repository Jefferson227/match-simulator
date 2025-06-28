import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSelector from './TeamSelector';
import { GeneralContext } from '../../contexts/GeneralContext';

// Mock the team service
jest.mock('../../services/teamService', () => ({
  loadTeamsForChampionship: jest.fn(),
  loadSpecificTeam: jest.fn(),
  loadAllTeamsExceptOne: jest.fn(),
}));

const mockLoadTeamsForChampionship =
  require('../../services/teamService').loadTeamsForChampionship;
const mockLoadSpecificTeam =
  require('../../services/teamService').loadSpecificTeam;
const mockLoadAllTeamsExceptOne =
  require('../../services/teamService').loadAllTeamsExceptOne;

const mockTeams = [
  {
    name: 'FLAMENGO',
    fileName: 'flamengo',
    colors: { bg: '#000000', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'CRUZEIRO',
    fileName: 'cruzeiro',
    colors: { bg: '#00008B', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BRAGANTINO',
    fileName: 'rb-bragantino',
    colors: { bg: '#ffffff', border: '#00008B', text: '#ff0000' },
  },
  {
    name: 'PALMEIRAS',
    fileName: 'palmeiras',
    colors: { bg: '#006400', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BAHIA',
    fileName: 'bahia',
    colors: { bg: '#0000CD', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'FLUMINENSE',
    fileName: 'fluminense',
    colors: { bg: '#006400', border: '#800000', text: '#ffffff' },
  },
  {
    name: 'A. MINEIRO',
    fileName: 'atletico-mg',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BOTAFOGO',
    fileName: 'botafogo',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'MIRASSOL',
    fileName: 'mirassol',
    colors: { bg: '#ffff00', border: '#006400', text: '#006400' },
  },
  {
    name: 'CORINTHIANS',
    fileName: 'corinthians',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'SÃO PAULO',
    fileName: 'sao-paulo',
    colors: { bg: '#ffffff', border: '#ff0000', text: '#000000' },
  },
];

const mockBaseTeam = {
  id: 'test-id',
  name: 'Clube de Regatas do Flamengo',
  shortName: 'Flamengo',
  abbreviation: 'FLA',
  colors: {
    outline: '#EC2125',
    background: '#030101',
    name: '#FAFAFC',
  },
  players: [
    { id: '1', position: 'GK', name: 'Rossi', strength: 85, mood: 100 },
    {
      id: '2',
      position: 'DF',
      name: 'Fabricio Bruno',
      strength: 82,
      mood: 100,
    },
  ],
  morale: 100,
  formation: '4-4-2',
  overallMood: 100,
  initialOverallStrength: 100,
};

// Mock the ChampionshipContext
const mockSetHumanPlayerBaseTeam = jest.fn();
const mockSetTeamsControlledAutomatically = jest.fn();
const mockSetSeasonMatchCalendar = jest.fn();

jest.mock('../../contexts/ChampionshipContext', () => ({
  useChampionshipContext: () => ({
    setHumanPlayerBaseTeam: mockSetHumanPlayerBaseTeam,
    setTeamsControlledAutomatically: mockSetTeamsControlledAutomatically,
    setSeasonMatchCalendar: mockSetSeasonMatchCalendar,
  }),
}));

// Mock the GeneralContext
const mockSetScreenDisplayed = jest.fn();

const mockGeneralContextValue = {
  setScreenDisplayed: mockSetScreenDisplayed,
  state: {
    currentPage: 1,
    baseTeam: {},
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'TeamSelector',
  },
  setCurrentPage: jest.fn(),
  getBaseTeam: jest.fn(),
  setBaseTeam: jest.fn(),
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

describe('TeamSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadTeamsForChampionship.mockResolvedValue(mockTeams);
    mockLoadSpecificTeam.mockResolvedValue(mockBaseTeam);
    mockLoadAllTeamsExceptOne.mockResolvedValue([mockBaseTeam]);
    mockSetHumanPlayerBaseTeam.mockClear();
    mockSetTeamsControlledAutomatically.mockClear();
    mockSetSeasonMatchCalendar.mockClear();
  });

  test('renders the component and initial teams', async () => {
    renderWithContext(<TeamSelector />);

    expect(screen.getByText('SELECT A TEAM')).toBeInTheDocument();
    expect(screen.getByText('Loading teams...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    expect(screen.getByText('MIRASSOL')).toBeInTheDocument();
    expect(screen.queryByText('CORINTHIANS')).not.toBeInTheDocument();
  });

  test('paginates to the next page of teams', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton);

    expect(screen.queryByText('FLAMENGO')).not.toBeInTheDocument();
    expect(screen.getByText('CORINTHIANS')).toBeInTheDocument();
  });

  test('loads team data and navigates to TeamManager when a team is clicked', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const flamengoButton = screen.getByText('FLAMENGO');
    fireEvent.click(flamengoButton);

    await waitFor(() => {
      expect(mockLoadSpecificTeam).toHaveBeenCalledWith(
        'brasileirao-serie-a',
        'flamengo'
      );
      expect(mockLoadAllTeamsExceptOne).toHaveBeenCalledWith(
        'brasileirao-serie-a',
        'flamengo'
      );
      expect(mockSetHumanPlayerBaseTeam).toHaveBeenCalledWith(mockBaseTeam);
      expect(mockSetTeamsControlledAutomatically).toHaveBeenCalledWith([
        mockBaseTeam,
      ]);
      expect(mockSetSeasonMatchCalendar).toHaveBeenCalledWith([]);
      expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    });
  });

  test('loads team data and navigates to TeamManager when any team is clicked', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('CRUZEIRO')).toBeInTheDocument();
    });

    const cruzeiroButton = screen.getByText('CRUZEIRO');
    fireEvent.click(cruzeiroButton);

    await waitFor(() => {
      expect(mockLoadSpecificTeam).toHaveBeenCalledWith(
        'brasileirao-serie-a',
        'cruzeiro'
      );
      expect(mockLoadAllTeamsExceptOne).toHaveBeenCalledWith(
        'brasileirao-serie-a',
        'cruzeiro'
      );
      expect(mockSetHumanPlayerBaseTeam).toHaveBeenCalledWith(mockBaseTeam);
      expect(mockSetTeamsControlledAutomatically).toHaveBeenCalledWith([
        mockBaseTeam,
      ]);
      expect(mockSetSeasonMatchCalendar).toHaveBeenCalledWith([]);
      expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    });
  });

  test('previous button is disabled on the first page', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const prevButton = screen.getByText('<');
    expect(prevButton).toBeDisabled();
  });

  test('next button is enabled on the first page', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('>');
    expect(nextButton).not.toBeDisabled();
  });

  test('next button is disabled on the last page', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Click to go to the last page

    expect(nextButton).toBeDisabled();
  });

  test('paginates to the previous page of teams', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('>');
    fireEvent.click(nextButton); // Go to next page

    const prevButton = screen.getByText('<');
    fireEvent.click(prevButton); // Go back to previous page

    expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    expect(screen.queryByText('CORINTHIANS')).not.toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderWithContext(<TeamSelector />);

    expect(screen.getByText('SELECT A TEAM')).toBeInTheDocument();
    expect(screen.getByText('Loading teams...')).toBeInTheDocument();
  });

  test('shows error state when team loading fails', async () => {
    mockLoadTeamsForChampionship.mockRejectedValue(new Error('Failed to load'));

    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load teams')).toBeInTheDocument();
    });
  });

  test('shows error when team data loading fails', async () => {
    mockLoadSpecificTeam.mockResolvedValue(null);

    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const flamengoButton = screen.getByText('FLAMENGO');
    fireEvent.click(flamengoButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to load team data')).toBeInTheDocument();
    });
  });
});
