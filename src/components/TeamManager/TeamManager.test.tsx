import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
    { id: 1, name: 'RICHARD', position: 'GK', strength: 80, mood: 70 },
    { id: 2, name: 'DAVID RICARDO', position: 'DEF', strength: 75, mood: 75 },
    { id: 3, name: 'MATHEUS BAHIA', position: 'DEF', strength: 78, mood: 80 },
    { id: 4, name: 'MATHEUS FELIPE', position: 'DEF', strength: 76, mood: 75 },
    { id: 5, name: 'RAÍ RAMOS', position: 'DEF', strength: 77, mood: 78 },
    { id: 6, name: 'RICHARDSON', position: 'MID', strength: 79, mood: 82 },
    { id: 7, name: 'LOURENÇO', position: 'MID', strength: 74, mood: 76 },
    { id: 8, name: 'G. CASTILHO', position: 'MID', strength: 73, mood: 75 },
    { id: 9, name: 'ERICK PULGA', position: 'FWD', strength: 82, mood: 85 },
    { id: 10, name: 'BARCELÓ', position: 'FWD', strength: 81, mood: 83 },
    { id: 11, name: 'AYLON', position: 'FWD', strength: 80, mood: 80 },
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

    // Check if the formation is displayed
    expect(screen.getByText('4-3-3')).toBeTruthy();

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
});
