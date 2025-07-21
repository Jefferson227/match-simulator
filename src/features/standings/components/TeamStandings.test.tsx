import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamStandings from './TeamStandings';
import { GeneralContext } from '@contexts/GeneralContext';
import { MatchContext } from '@contexts/MatchContext';
import { TableStanding } from '@types/championship';

// Mock the necessary hooks and context
jest.mock('@contexts/GeneralContext', () => ({
  __esModule: true,
  ...jest.requireActual('@contexts/GeneralContext'),
}));

// Mock the useChampionshipContext hook
const mockUseChampionshipContext = jest.fn();
jest.mock('@contexts/ChampionshipContext', () => ({
  ...jest.requireActual('@contexts/ChampionshipContext'),
  useChampionshipContext: () => mockUseChampionshipContext(),
}));

// Mock the MatchProvider
const mockMatchContextValue = {
  matches: [],
  teamSquadView: null,
  setMatches: jest.fn(),
  setScorer: jest.fn(),
  increaseScore: jest.fn(), // Changed from setScore to increaseScore to match the interface
  setTeamSquadView: jest.fn(),
  confirmSubstitution: jest.fn(),
  loadState: jest.fn(),
  getMatchById: jest.fn(),
  getMatchesByRound: jest.fn(),
};

// Mock the GeneralContext
const mockSetScreenDisplayed = jest.fn();

const mockGeneralContextValue = {
  state: {
    currentPage: 1,
    baseTeam: {} as any,
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'TeamManager',
    clockSpeed: 1,
  },
  setCurrentPage: jest.fn(),
  getBaseTeam: jest.fn(),
  setBaseTeam: jest.fn(),
  setMatchTeam: jest.fn(),
  setMatchOtherTeams: jest.fn(),
  setScreenDisplayed: mockSetScreenDisplayed,
  setClockSpeed: jest.fn(),
  loadState: jest.fn(),
};

// Mock the ChampionshipProvider and useChampionship hook
const mockChampionshipContextValue = {
  state: {
    tableStandings: [] as TableStanding[],
    selectedChampionship: 'premier-league',
    currentRound: 1,
    totalRounds: 38,
    year: 2023,
  },
  getTableStandings: jest.fn(),
  setChampionship: jest.fn(),
  setTeamsControlledAutomatically: jest.fn(),
  setSeasonMatchCalendar: jest.fn(),
  incrementYear: jest.fn(),
  setCurrentRound: jest.fn(),
  incrementCurrentRound: jest.fn(),
  resetTableStandings: jest.fn(),
  addOrUpdateOtherChampionship: jest.fn(),
};

const renderWithContext = (component: React.ReactElement) => {
  mockUseChampionshipContext.mockReturnValue(mockChampionshipContextValue);

  return render(
    <GeneralContext.Provider value={mockGeneralContextValue}>
      <MatchContext.Provider value={mockMatchContextValue}>
        {component}
      </MatchContext.Provider>
    </GeneralContext.Provider>
  );
};

describe('TeamStandings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders the component with default placeholder standings', () => {
      renderWithContext(<TeamStandings />);
      expect(screen.getByText('Team Standings')).toBeInTheDocument();
    });

    test('displays the correct number of teams when standings are provided', () => {
      // Mock standings data
      const mockStandings: TableStanding[] = [
        {
          teamId: 'team-a',
          teamName: 'Team A',
          teamAbbreviation: 'TEA',
          wins: 5,
          draws: 2,
          losses: 1,
          goalsFor: 15,
          goalsAgainst: 7,
          goalDifference: 8,
          points: 17,
        },
        {
          teamId: 'team-b',
          teamName: 'Team B',
          teamAbbreviation: 'TEB',
          wins: 4,
          draws: 3,
          losses: 1,
          goalsFor: 12,
          goalsAgainst: 7,
          goalDifference: 5,
          points: 15,
        },
      ];

      // Render the component with the mock standings data
      renderWithContext(<TeamStandings standings={mockStandings} />);

      // Verify the table structure and content
      screen.getByRole('table'); // Verify table exists
      const rows = screen.getAllByRole('row');
      
      // Should have header row + 2 team rows
      expect(rows).toHaveLength(3);
      
      // Get team rows (skip header)
      const teamRows = rows.slice(1);
      
      // Verify each team's data
      const teamARow = teamRows[0];
      const teamBRow = teamRows[1];
      
      // Team A assertions
      expect(within(teamARow).getByText('Team A')).toBeInTheDocument();
      expect(within(teamARow).getByText('17')).toBeInTheDocument(); // Points
      expect(within(teamARow).getByText('15')).toBeInTheDocument(); // Goals For
      expect(within(teamARow).getByText('7')).toBeInTheDocument();  // Goals Against
      
      // Team B assertions
      expect(within(teamBRow).getByText('Team B')).toBeInTheDocument();
      expect(within(teamBRow).getByText('15')).toBeInTheDocument(); // Points
      expect(within(teamBRow).getByText('12')).toBeInTheDocument(); // Goals For
      expect(within(teamBRow).getByText('7')).toBeInTheDocument();  // Goals Against
      
      // Verify the order of teams (Team A first with higher points)
      const teamCells = screen.getAllByRole('cell');
      const teamNames = Array.from(teamCells)
        .filter(cell => cell.textContent === 'Team A' || cell.textContent === 'Team B')
        .map(cell => cell.textContent);
      
      expect(teamNames).toEqual(['Team A', 'Team B']);
    });
  });
});
