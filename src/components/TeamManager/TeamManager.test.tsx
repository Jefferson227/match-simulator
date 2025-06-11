/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamManager from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GeneralContext } from '../../contexts/GeneralContext';
import { Team } from '../../types';

// Mock the utils module
jest.mock('../../utils/utils', () => ({
  __esModule: true,
  default: {
    getTeamFormation: () => '4-3-3',
  },
}));

// Mock data
const mockTeam: Team = {
  id: '1',
  name: 'CEARÁ SPORTING CLUB',
  abbreviation: 'CEA',
  formation: '4-3-3',
  colors: {
    outline: '#000000',
    background: '#ffffff',
    name: '#000000',
  },
  players: [
    { id: '1', name: 'RICHARD', position: 'GK', strength: 80, mood: 70 },
    { id: '2', name: 'DAVID RICARDO', position: 'DEF', strength: 75, mood: 75 },
    { id: '3', name: 'MATHEUS BAHIA', position: 'DEF', strength: 78, mood: 80 },
    {
      id: '4',
      name: 'MATHEUS FELIPE',
      position: 'DEF',
      strength: 76,
      mood: 75,
    },
    { id: '5', name: 'RAÍ RAMOS', position: 'DEF', strength: 77, mood: 78 },
    { id: '6', name: 'RICHARDSON', position: 'MID', strength: 79, mood: 82 },
    { id: '7', name: 'LOURENÇO', position: 'MID', strength: 74, mood: 76 },
    { id: '8', name: 'G. CASTILHO', position: 'MID', strength: 73, mood: 75 },
    { id: '9', name: 'ERICK PULGA', position: 'FWD', strength: 82, mood: 85 },
    { id: '10', name: 'BARCELÓ', position: 'FWD', strength: 81, mood: 83 },
    { id: '11', name: 'AYLON', position: 'FWD', strength: 80, mood: 80 },
  ],
  substitutes: [],
  score: 0,
  morale: 50,
  overallMood: 78,
  overallStrength: 78,
  attackStrength: 81,
  midfieldStrength: 75,
  defenseStrength: 77,
  isHomeTeam: true,
};

const mockContextValue = {
  state: {
    currentPage: 1,
    selectedTeam: mockTeam,
    isMatchStarted: false,
  },
  getSelectedTeam: jest.fn(),
  setCurrentPage: jest.fn(),
  setMatchStarted: jest.fn(),
};

// Enum for player selection state (copy from TeamManager)
enum PlayerSelectionState {
  Unselected = 0,
  Selected = 1,
  Substitute = 2,
}

// Add a mock team with 15 players for pagination tests
const mockTeamManyPlayers: Team = {
  ...mockTeam,
  players: [
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `PLAYER${i + 1}`,
      position: i === 0 ? 'GK' : i < 6 ? 'DEF' : i < 11 ? 'MID' : 'FWD',
      strength: 70 + i,
      mood: 70,
    })),
  ],
};

describe('TeamManager', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  it('calls getSelectedTeam on mount', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(mockContextValue.getSelectedTeam).toHaveBeenCalledTimes(1);
    });
  });

  it('renders the team information correctly', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Check if the team name is displayed in uppercase
    const teamNameElement = screen.getByText(mockTeam.name);
    expect(teamNameElement).toBeTruthy();
    expect(teamNameElement.className).toContain('uppercase');

    // Check if the formation or selected count is displayed
    expect(screen.getByText('0 SELECTED')).toBeInTheDocument();

    // Check if all players are displayed with their positions and strengths
    mockTeam.players.forEach((player) => {
      const playerElement = screen.getByText(player.name).closest('div');
      expect(playerElement).toBeTruthy();
      expect(playerElement?.textContent).toContain(player.position);
      expect(playerElement?.textContent).toContain(player.strength.toString());
    });

    // Check if the button labels are displayed
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
    expect(screen.getByText('PREVIOUS PAGE')).toBeTruthy();
    expect(screen.getByText('NEXT PAGE')).toBeTruthy();
    expect(screen.getByText('START MATCH')).toBeTruthy();
  });

  it('renders correctly when team data is not available', () => {
    const contextWithNoTeam = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        selectedTeam: {} as Team,
      },
    };

    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={contextWithNoTeam}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Check if the buttons are still rendered
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
    expect(screen.getByText('PREVIOUS PAGE')).toBeTruthy();
    expect(screen.getByText('NEXT PAGE')).toBeTruthy();
    expect(screen.getByText('START MATCH')).toBeTruthy();
  });

  it('shows formation grid and hides player list/navigation when Choose Formation is clicked', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Click the 'Choose Formation' button
    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    // Wait for the formation grid to appear
    await waitFor(() => {
      expect(screen.getByText('5-3-2')).toBeTruthy();
      expect(screen.getByText('3-5-2')).toBeTruthy();
      expect(screen.getByText('BEST PLAYERS')).toBeTruthy();
      expect(screen.getByText('GO BACK')).toBeTruthy();
    });

    // Player list and navigation buttons should be hidden
    expect(screen.queryByText('RICHARD')).toBeNull();
    expect(screen.queryByText('PREVIOUS PAGE')).toBeNull();
    expect(screen.queryByText('NEXT PAGE')).toBeNull();
    expect(screen.queryByText('START MATCH')).toBeNull();

    // Formation section should show 'CHOOSE FORMATION'
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
  });

  it('returns to player list and navigation when Go Back is clicked', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Click the 'Choose Formation' button
    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    // Wait for the 'Go Back' button to appear
    const goBackBtn = await screen.findByText('GO BACK');
    fireEvent.click(goBackBtn);

    // Wait for the player list and navigation buttons to be visible again
    await waitFor(() => {
      expect(screen.getByText('RICHARD')).toBeTruthy();
      expect(screen.getByText('PREVIOUS PAGE')).toBeTruthy();
      expect(screen.getByText('NEXT PAGE')).toBeTruthy();
      expect(screen.getByText('START MATCH')).toBeTruthy();

      // Formation grid should be hidden
      expect(screen.queryByText('5-3-2')).toBeNull();
      expect(screen.queryByText('BEST PLAYERS')).toBeNull();
      expect(screen.queryByText('GO BACK')).toBeNull();
    });
  });

  it('cycles player selection through unselected, selected, substitute, and back', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Find the player row for RICHARD
    const playerRow = screen.getByText('RICHARD').closest('div');
    expect(playerRow).toBeTruthy();

    // 1st click: should highlight position (selected)
    fireEvent.click(playerRow!);
    const posBox = playerRow!.querySelector('span');
    expect(posBox).toHaveClass('bg-[#e2e2e2]');
    expect(posBox).toHaveClass('text-[#1e1e1e]');
    // Name should NOT be underlined
    const nameSpan = screen.getByText('RICHARD');
    expect(nameSpan).not.toHaveClass('underline');

    // 2nd click: should remove highlight and underline name (substitute)
    fireEvent.click(playerRow!);
    expect(posBox).not.toHaveClass('bg-[#e2e2e2]');
    expect(posBox).not.toHaveClass('text-[#1e1e1e]');
    expect(nameSpan).toHaveClass('underline');

    // 3rd click: should return to unselected (no highlight, no underline)
    fireEvent.click(playerRow!);
    expect(posBox).not.toHaveClass('bg-[#e2e2e2]');
    expect(posBox).not.toHaveClass('text-[#1e1e1e]');
    expect(nameSpan).not.toHaveClass('underline');
  });

  it('shows selected count or formation based on number of selected players', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    // Initially, no players are selected
    expect(screen.getByText('0 SELECTED')).toBeInTheDocument();

    // Select 5 players
    const playerNames = mockTeam.players.map((p) => p.name);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText(playerNames[i]));
    }
    expect(screen.getByText('5 SELECTED')).toBeInTheDocument();

    // Select up to 11 players
    for (let i = 5; i < 11; i++) {
      fireEvent.click(screen.getByText(playerNames[i]));
    }
    // Now, formation should be shown
    expect(screen.getByText('4-3-3')).toBeInTheDocument();
  });
});

describe('TeamManager pagination', () => {
  const contextValue = {
    ...mockContextValue,
    state: {
      ...mockContextValue.state,
      selectedTeam: mockTeamManyPlayers,
    },
  };

  it('shows only 11 players per page', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={contextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    // Only PLAYER1 to PLAYER11 should be visible
    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(`PLAYER${i}`)).toBeInTheDocument();
    }
    // PLAYER12+ should not be visible
    for (let i = 12; i <= 15; i++) {
      expect(screen.queryByText(`PLAYER${i}`)).toBeNull();
    }
  });

  it('shows next page of players when Next Page is clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={contextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    fireEvent.click(screen.getByText('NEXT PAGE'));
    // PLAYER12 to PLAYER15 should be visible
    for (let i = 12; i <= 15; i++) {
      expect(screen.getByText(`PLAYER${i}`)).toBeInTheDocument();
    }
    // PLAYER1 to PLAYER11 should not be visible
    for (let i = 1; i <= 11; i++) {
      expect(screen.queryByText(`PLAYER${i}`)).toBeNull();
    }
  });

  it('disables Previous Page on first page and Next Page on last page', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={contextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    const prevBtn = screen.getByText('PREVIOUS PAGE');
    const nextBtn = screen.getByText('NEXT PAGE');
    // On first page
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
    // Go to last page
    fireEvent.click(nextBtn);
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });
});
