import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamSelector from './TeamSelector';
import { GeneralContext } from '../../contexts/GeneralContext';

// Mock the team service
jest.mock('../../services/teamService', () => ({
  loadTeamsForChampionship: jest.fn(),
}));

const mockLoadTeamsForChampionship =
  require('../../services/teamService').loadTeamsForChampionship;

const mockTeams = [
  {
    name: 'FLAMENGO',
    colors: { bg: '#000000', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'CRUZEIRO',
    colors: { bg: '#00008B', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BRAGANTINO',
    colors: { bg: '#ffffff', border: '#00008B', text: '#ff0000' },
  },
  {
    name: 'PALMEIRAS',
    colors: { bg: '#006400', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BAHIA',
    colors: { bg: '#0000CD', border: '#ff0000', text: '#ffffff' },
  },
  {
    name: 'FLUMINENSE',
    colors: { bg: '#006400', border: '#800000', text: '#ffffff' },
  },
  {
    name: 'A. MINEIRO',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'BOTAFOGO',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'MIRASSOL',
    colors: { bg: '#ffff00', border: '#006400', text: '#006400' },
  },
  {
    name: 'CORINTHIANS',
    colors: { bg: '#000000', border: '#ffffff', text: '#ffffff' },
  },
  {
    name: 'SÃO PAULO',
    colors: { bg: '#ffffff', border: '#ff0000', text: '#000000' },
  },
];

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

  test('calls setScreenDisplayed with "TeamManager" when a team is clicked', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('FLAMENGO')).toBeInTheDocument();
    });

    const flamengoButton = screen.getByText('FLAMENGO');
    fireEvent.click(flamengoButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
  });

  test('calls setScreenDisplayed with "TeamManager" when any team is clicked', async () => {
    renderWithContext(<TeamSelector />);

    await waitFor(() => {
      expect(screen.getByText('CRUZEIRO')).toBeInTheDocument();
    });

    const cruzeiroButton = screen.getByText('CRUZEIRO');
    fireEvent.click(cruzeiroButton);

    expect(mockSetScreenDisplayed).toHaveBeenCalledWith('TeamManager');
    expect(mockSetScreenDisplayed).toHaveBeenCalledTimes(1);
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
});
