/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamManager, { FORMATIONS } from './TeamManager';
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
    {
      id: '15',
      name: 'BRUNO FERREIRA',
      position: 'GK',
      strength: 75,
      mood: 70,
    },
    { id: '2', name: 'DAVID RICARDO', position: 'DF', strength: 75, mood: 75 },
    { id: '3', name: 'MATHEUS BAHIA', position: 'DF', strength: 78, mood: 80 },
    { id: '4', name: 'MATHEUS FELIPE', position: 'DF', strength: 76, mood: 75 },
    { id: '5', name: 'RAÍ RAMOS', position: 'DF', strength: 77, mood: 78 },
    { id: '16', name: 'JOAO VICTOR', position: 'DF', strength: 74, mood: 75 },
    { id: '17', name: 'LUCAS RIBEIRO', position: 'DF', strength: 73, mood: 74 },
    { id: '6', name: 'RICHARDSON', position: 'MF', strength: 79, mood: 82 },
    { id: '7', name: 'LOURENÇO', position: 'MF', strength: 74, mood: 76 },
    { id: '8', name: 'G. CASTILHO', position: 'MF', strength: 73, mood: 75 },
    { id: '18', name: 'PEDRO LUCAS', position: 'MF', strength: 72, mood: 73 },
    { id: '19', name: 'VITOR JACARE', position: 'MF', strength: 71, mood: 72 },
    { id: '9', name: 'ERICK PULGA', position: 'FW', strength: 82, mood: 85 },
    { id: '10', name: 'BARCELÓ', position: 'FW', strength: 81, mood: 83 },
    { id: '11', name: 'AYLON', position: 'FW', strength: 80, mood: 80 },
    { id: '20', name: 'JUNIOR VIANA', position: 'FW', strength: 79, mood: 79 },
    { id: '21', name: 'LUCAS CRUZ', position: 'FW', strength: 78, mood: 78 },
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

// Add a mock team with 15 players for pagination tests
const mockTeamManyPlayers: Team = {
  ...mockTeam,
  players: [
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      name: `PLAYER${i + 1}`,
      position: i === 0 ? 'GK' : i < 6 ? 'DF' : i < 11 ? 'MF' : 'FW',
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
    expect(screen.getByText('0 SELECTED')).toBeTruthy();

    // Check if all players on the first page are displayed with their positions and strengths
    const firstPagePlayers = mockTeam.players.slice(0, 11);
    firstPagePlayers.forEach((player) => {
      const playerElement = screen.getByText(player.name).closest('div');
      expect(playerElement).toBeTruthy();
      expect(playerElement?.textContent).toContain(player.position);
      expect(playerElement?.textContent).toContain(player.strength.toString());
    });

    // Check if the button labels are displayed
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
    expect(screen.getByText('PREVIOUS PAGE')).toBeTruthy();
    expect(screen.getByText('NEXT PAGE')).toBeTruthy();
    // START MATCH button should not be visible initially
    expect(screen.queryByText('START MATCH')).toBeNull();
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
    // START MATCH button should not be visible
    expect(screen.queryByText('START MATCH')).toBeNull();
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
      // START MATCH button should not be visible
      expect(screen.queryByText('START MATCH')).toBeNull();

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
    expect(posBox?.className).toContain('bg-[#e2e2e2]');
    expect(posBox?.className).toContain('text-[#1e1e1e]');
    // Name should NOT be underlined
    const nameSpan = screen.getByText('RICHARD');
    expect(nameSpan.className).not.toContain('underline');

    // 2nd click: should remove highlight and underline name (substitute)
    fireEvent.click(playerRow!);
    expect(posBox?.className).not.toContain('bg-[#e2e2e2]');
    expect(posBox?.className).not.toContain('text-[#1e1e1e]');
    expect(nameSpan.className).toContain('underline');

    // 3rd click: should return to unselected (no highlight, no underline)
    fireEvent.click(playerRow!);
    expect(posBox?.className).not.toContain('bg-[#e2e2e2]');
    expect(posBox?.className).not.toContain('text-[#1e1e1e]');
    expect(nameSpan.className).not.toContain('underline');
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
    expect(screen.getByText('0 SELECTED')).toBeTruthy();

    // Helper function to select a player by name
    const selectPlayer = (playerName: string) => {
      // Try to find the player on the current page
      let playerElement = screen.queryByText(playerName)?.closest('div');

      // If not found and there's a next page button that's not disabled, try next page
      const nextPageButton = screen.getByText('NEXT PAGE');
      if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }

      // If still not found and there's a previous page button that's not disabled, try previous page
      const prevPageButton = screen.getByText('PREVIOUS PAGE');
      if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }

      expect(playerElement).toBeTruthy();
      fireEvent.click(playerElement!);
    };

    // Select the best GK
    selectPlayer('RICHARD');

    // Select the best 4 defenders
    const defenders = mockTeam.players
      .filter((p) => p.position === 'DF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 4);
    defenders.forEach((df) => {
      selectPlayer(df.name);
    });

    // Select the best 3 midfielders
    const midfielders = mockTeam.players
      .filter((p) => p.position === 'MF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    midfielders.forEach((mf) => {
      selectPlayer(mf.name);
    });

    // Select the best 3 forwards
    const forwards = mockTeam.players
      .filter((p) => p.position === 'FW')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    forwards.forEach((fw) => {
      selectPlayer(fw.name);
    });

    // Now, formation should be shown based on selected players
    // In this case, we selected 4 DF, 3 MF, and 3 FW (plus 1 GK)
    expect(screen.getByText('4-3-3')).toBeTruthy();
  });

  it('allows only one GK to be selected at a time', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    // Find the two GKs
    const gk1 = screen.getByText('RICHARD').closest('div');
    const gk2 = screen.getByText('BRUNO FERREIRA').closest('div');
    expect(gk1).toBeTruthy();
    expect(gk2).toBeTruthy();

    // Select the first GK (should succeed)
    fireEvent.click(gk1!);
    let posBox1 = gk1!.querySelector('span');
    let posBox2 = gk2!.querySelector('span');
    expect(posBox1?.className).toContain('bg-[#e2e2e2]');
    expect(posBox2?.className).not.toContain('bg-[#e2e2e2]');

    // Try to select the second GK (should be ignored for 'Selected', but will cycle to 'Substitute')
    fireEvent.click(gk2!);
    posBox1 = gk1!.querySelector('span');
    posBox2 = gk2!.querySelector('span');
    expect(posBox1?.className).toContain('bg-[#e2e2e2]');
    // The second GK should NOT be selected (should not have the selected class)
    expect(posBox2?.className).not.toContain('bg-[#e2e2e2]');

    // Deselect the first GK (cycle: selected -> substitute -> unselected)
    fireEvent.click(gk1!); // to substitute
    fireEvent.click(gk1!); // to unselected
    posBox1 = gk1!.querySelector('span');
    posBox2 = gk2!.querySelector('span');
    expect(posBox1?.className).not.toContain('bg-[#e2e2e2]');
    expect(posBox2?.className).not.toContain('bg-[#e2e2e2]');

    // Now select the second GK (should succeed)
    fireEvent.click(gk2!);
    posBox1 = gk1!.querySelector('span');
    posBox2 = gk2!.querySelector('span');
    expect(posBox1?.className).not.toContain('bg-[#e2e2e2]');
    expect(posBox2?.className).toContain('bg-[#e2e2e2]');
  });

  it('shows START MATCH button only when exactly 11 players are selected', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Initially, START MATCH button should not be visible
    expect(screen.queryByText('START MATCH')).toBeNull();

    // Select exactly one GK and the next 10 outfield players, checking all pages if needed
    let selectedCount = 0;
    let gkSelected = false;
    let currentPage = 0;
    const totalPages = Math.ceil(mockTeam.players.length / 11);

    while (selectedCount < 11 && currentPage < totalPages) {
      // Get players for current page
      const startIdx = currentPage * 11;
      const endIdx = Math.min(startIdx + 11, mockTeam.players.length);
      const pagePlayers = mockTeam.players.slice(startIdx, endIdx);

      // Try to select players from this page
      for (const player of pagePlayers) {
        if (selectedCount >= 11) break;

        if (player.position === 'GK') {
          if (gkSelected) continue;
          gkSelected = true;
        }

        fireEvent.click(screen.getByText(player.name));
        selectedCount++;
      }

      // If we still need more players and there's a next page, go to it
      if (selectedCount < 11 && currentPage < totalPages - 1) {
        fireEvent.click(screen.getByText('NEXT PAGE'));
        currentPage++;
      }
    }

    // Now START MATCH button should be visible
    const startMatchButton = screen.getByText('START MATCH');
    expect(startMatchButton).toBeTruthy();
  });

  describe('Formation Selection', () => {
    it('disables formations that require more players than available', () => {
      // Create a team with limited players
      const limitedTeam = {
        ...mockTeam,
        players: [
          { id: '1', name: 'RICHARD', position: 'GK', strength: 80, mood: 70 },
          {
            id: '2',
            name: 'DAVID RICARDO',
            position: 'DF',
            strength: 75,
            mood: 75,
          },
          {
            id: '3',
            name: 'MATHEUS BAHIA',
            position: 'DF',
            strength: 78,
            mood: 80,
          },
          {
            id: '4',
            name: 'MATHEUS FELIPE',
            position: 'DF',
            strength: 76,
            mood: 75,
          },
          {
            id: '5',
            name: 'RAÍ RAMOS',
            position: 'MF',
            strength: 77,
            mood: 78,
          },
          {
            id: '6',
            name: 'RICHARDSON',
            position: 'MF',
            strength: 79,
            mood: 82,
          },
          { id: '7', name: 'LOURENÇO', position: 'FW', strength: 74, mood: 76 },
        ],
      };

      const contextWithLimitedTeam = {
        ...mockContextValue,
        state: {
          ...mockContextValue.state,
          selectedTeam: limitedTeam,
        },
      };

      render(
        <I18nextProvider i18n={i18n}>
          <GeneralContext.Provider value={contextWithLimitedTeam}>
            <TeamManager />
          </GeneralContext.Provider>
        </I18nextProvider>
      );

      // Click the 'Choose Formation' button
      fireEvent.click(screen.getByText('CHOOSE FORMATION'));

      // 4-4-2 should be disabled (not enough players)
      const formation442 = screen.getByText('4-4-2');
      expect(formation442.className).toContain('text-gray-500');
      expect(formation442.hasAttribute('disabled')).toBe(true);

      // 3-4-3 should be disabled (not enough forwards)
      const formation343 = screen.getByText('3-4-3');
      expect(formation343.className).toContain('text-gray-500');
      expect(formation343.hasAttribute('disabled')).toBe(true);
    });

    it('selects best players and substitutes when a formation is chosen', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <GeneralContext.Provider value={mockContextValue}>
            <TeamManager />
          </GeneralContext.Provider>
        </I18nextProvider>
      );

      // Click the 'Choose Formation' button
      fireEvent.click(screen.getByText('CHOOSE FORMATION'));

      // Select 4-3-3 formation
      fireEvent.click(screen.getByText('4-3-3'));

      // Helper function to check if a player is selected or substitute
      const checkPlayerState = (
        playerName: string,
        isSubstitute: boolean = false
      ) => {
        // Try to find the player on the current page
        let playerElement = screen.queryByText(playerName)?.closest('div');

        // If not found and there's a next page button that's not disabled, try next page
        const nextPageButton = screen.getByText('NEXT PAGE');
        if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
          fireEvent.click(nextPageButton);
          playerElement = screen.queryByText(playerName)?.closest('div');
        }

        // If still not found and there's a previous page button that's not disabled, try previous page
        const prevPageButton = screen.getByText('PREVIOUS PAGE');
        if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
          fireEvent.click(prevPageButton);
          playerElement = screen.queryByText(playerName)?.closest('div');
        }

        expect(playerElement).toBeTruthy();

        if (isSubstitute) {
          // Check if name is underlined (substitute)
          expect(
            playerElement?.querySelector('span:nth-child(2)')?.className
          ).toContain('underline');
          // Check if position is not highlighted
          expect(
            playerElement?.querySelector('span:first-child')?.className
          ).not.toContain('bg-[#e2e2e2]');
        } else {
          // Check if position is highlighted (selected)
          expect(
            playerElement?.querySelector('span:first-child')?.className
          ).toContain('bg-[#e2e2e2]');
          // Check if name is not underlined
          expect(
            playerElement?.querySelector('span:nth-child(2)')?.className
          ).not.toContain('underline');
        }
      };

      // Check if the best GK is selected
      checkPlayerState('RICHARD');

      // Check if the best defenders are selected
      const defenders = mockTeam.players
        .filter((p) => p.position === 'DF')
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 4);
      defenders.forEach((df) => {
        checkPlayerState(df.name);
      });

      // Check if the best midfielders are selected
      const midfielders = mockTeam.players
        .filter((p) => p.position === 'MF')
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3);
      midfielders.forEach((mf) => {
        checkPlayerState(mf.name);
      });

      // Check if the best forwards are selected
      const forwards = mockTeam.players
        .filter((p) => p.position === 'FW')
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3);
      forwards.forEach((fw) => {
        checkPlayerState(fw.name);
      });

      // Check if the best GK substitute is selected
      const gkSubs = mockTeam.players
        .filter((p) => p.position === 'GK' && p.name !== 'RICHARD')
        .sort((a, b) => b.strength - a.strength);
      if (gkSubs.length > 0) {
        checkPlayerState(gkSubs[0].name, true);
      }

      // Check if the best DF substitutes are selected
      const dfSubs = mockTeam.players
        .filter((p) => p.position === 'DF' && !defenders.includes(p))
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 2);
      dfSubs.forEach((df) => {
        checkPlayerState(df.name, true);
      });

      // Check if the best MF substitutes are selected
      const mfSubs = mockTeam.players
        .filter((p) => p.position === 'MF' && !midfielders.includes(p))
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 2);
      mfSubs.forEach((mf) => {
        checkPlayerState(mf.name, true);
      });

      // Check if the best FW substitutes are selected
      const fwSubs = mockTeam.players
        .filter((p) => p.position === 'FW' && !forwards.includes(p))
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 2);
      fwSubs.forEach((fw) => {
        checkPlayerState(fw.name, true);
      });

      // Check if formation grid is closed
      expect(screen.queryByText('CHOOSE FORMATION')).toBeTruthy();

      // Check if START MATCH button is visible (indicating 11 players are selected)
      expect(screen.getByText('START MATCH')).toBeTruthy();
    });

    it('shows formation grid with correct styling for available/unavailable formations', () => {
      render(
        <I18nextProvider i18n={i18n}>
          <GeneralContext.Provider value={mockContextValue}>
            <TeamManager />
          </GeneralContext.Provider>
        </I18nextProvider>
      );

      // Click the 'Choose Formation' button
      fireEvent.click(screen.getByText('CHOOSE FORMATION'));

      // Check if all formations are rendered
      FORMATIONS.forEach((formation: string) => {
        const formationButton = screen.getByText(formation);
        expect(formationButton).toBeTruthy();

        // Check if button has correct styling based on availability
        const isAvailable =
          mockTeam.players.filter((p) => p.position === 'DF').length >=
            parseInt(formation.split('-')[0]) &&
          mockTeam.players.filter((p) => p.position === 'MF').length >=
            parseInt(formation.split('-')[1]) &&
          mockTeam.players.filter((p) => p.position === 'FW').length >=
            parseInt(formation.split('-')[2]);

        if (isAvailable) {
          expect(formationButton.className).not.toContain('text-gray-500');
          expect(formationButton.hasAttribute('disabled')).toBe(false);
        } else {
          expect(formationButton.className).toContain('text-gray-500');
          expect(formationButton.hasAttribute('disabled')).toBe(true);
        }
      });
    });
  });

  it('enforces selection limits of 11 players and 7 substitutes', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Helper function to select a player by name
    const selectPlayer = (playerName: string) => {
      // Try to find the player on the current page
      let playerElement = screen.queryByText(playerName)?.closest('div');

      // If not found and there's a next page button that's not disabled, try next page
      const nextPageButton = screen.getByText('NEXT PAGE');
      if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }

      // If still not found and there's a previous page button that's not disabled, try previous page
      const prevPageButton = screen.getByText('PREVIOUS PAGE');
      if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }

      expect(playerElement).toBeTruthy();
      fireEvent.click(playerElement!);
    };

    // Helper function to check if a player is selected or substitute
    const checkPlayerState = (
      playerName: string,
      isSubstitute: boolean = false
    ) => {
      let playerElement = screen.queryByText(playerName)?.closest('div');

      if (!playerElement) {
        const nextPageButton = screen.getByText('NEXT PAGE');
        if (!nextPageButton.hasAttribute('disabled')) {
          fireEvent.click(nextPageButton);
          playerElement = screen.queryByText(playerName)?.closest('div');
        }
      }

      if (!playerElement) {
        const prevPageButton = screen.getByText('PREVIOUS PAGE');
        if (!prevPageButton.hasAttribute('disabled')) {
          fireEvent.click(prevPageButton);
          playerElement = screen.queryByText(playerName)?.closest('div');
        }
      }

      expect(playerElement).toBeTruthy();

      if (isSubstitute) {
        expect(
          playerElement?.querySelector('span:nth-child(2)')?.className
        ).toContain('underline');
        expect(
          playerElement?.querySelector('span:first-child')?.className
        ).not.toContain('bg-[#e2e2e2]');
      } else {
        expect(
          playerElement?.querySelector('span:first-child')?.className
        ).toContain('bg-[#e2e2e2]');
        expect(
          playerElement?.querySelector('span:nth-child(2)')?.className
        ).not.toContain('underline');
      }
    };

    // First, select some substitutes before reaching 11 players
    // Select GK substitute
    selectPlayer('BRUNO FERREIRA');
    selectPlayer('BRUNO FERREIRA'); // Second click to make it a substitute
    checkPlayerState('BRUNO FERREIRA', true);

    // Select DF substitutes
    const dfSubs = mockTeam.players
      .filter((p) => p.position === 'DF')
      .sort((a, b) => b.strength - a.strength)
      .slice(4, 6); // Get the next 2 best defenders
    dfSubs.forEach((df) => {
      selectPlayer(df.name);
      selectPlayer(df.name); // Second click to make it a substitute
      checkPlayerState(df.name, true);
    });

    // Select MF substitutes
    const mfSubs = mockTeam.players
      .filter((p) => p.position === 'MF')
      .sort((a, b) => b.strength - a.strength)
      .slice(3, 5); // Get the next 2 best midfielders
    mfSubs.forEach((mf) => {
      selectPlayer(mf.name);
      selectPlayer(mf.name); // Second click to make it a substitute
      checkPlayerState(mf.name, true);
    });

    // Select FW substitutes
    const fwSubs = mockTeam.players
      .filter((p) => p.position === 'FW')
      .sort((a, b) => b.strength - a.strength)
      .slice(3, 5); // Get the next 2 best forwards
    fwSubs.forEach((fw) => {
      selectPlayer(fw.name);
      selectPlayer(fw.name); // Second click to make it a substitute
      checkPlayerState(fw.name, true);
    });

    // Now select the starting 11
    // Select the best GK
    selectPlayer('RICHARD');

    // Select the best 4 defenders
    const defenders = mockTeam.players
      .filter((p) => p.position === 'DF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 4);
    defenders.forEach((df) => {
      selectPlayer(df.name);
    });

    // Select the best 3 midfielders
    const midfielders = mockTeam.players
      .filter((p) => p.position === 'MF')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    midfielders.forEach((mf) => {
      selectPlayer(mf.name);
    });

    // Select the best 3 forwards
    const forwards = mockTeam.players
      .filter((p) => p.position === 'FW')
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);
    forwards.forEach((fw) => {
      selectPlayer(fw.name);
    });

    // Verify we have 11 selected players
    expect(screen.getByText('4-3-3')).toBeTruthy();

    // Try to select an additional player - should not be possible
    const extraPlayer = mockTeam.players.find(
      (p) =>
        !defenders.includes(p) &&
        !midfielders.includes(p) &&
        !forwards.includes(p) &&
        p.name !== 'RICHARD' &&
        !dfSubs.includes(p) &&
        !mfSubs.includes(p) &&
        !fwSubs.includes(p) &&
        p.name !== 'BRUNO FERREIRA'
    );
    if (extraPlayer) {
      selectPlayer(extraPlayer.name);
      // The player should not be selected (no highlight)
      const playerElement = screen
        .queryByText(extraPlayer.name)
        ?.closest('div');
      expect(
        playerElement?.querySelector('span:first-child')?.className
      ).not.toContain('bg-[#e2e2e2]');
    }

    // Try to select an additional substitute - should not be possible
    const extraSub = mockTeam.players.find(
      (p) =>
        !dfSubs.includes(p) &&
        !mfSubs.includes(p) &&
        !fwSubs.includes(p) &&
        p.name !== 'BRUNO FERREIRA' &&
        !defenders.includes(p) &&
        !midfielders.includes(p) &&
        !forwards.includes(p) &&
        p.name !== 'RICHARD'
    );
    if (extraSub) {
      selectPlayer(extraSub.name);
      // The player should not be a substitute (no underline)
      const playerElement = screen.queryByText(extraSub.name)?.closest('div');
      expect(
        playerElement?.querySelector('span:nth-child(2)')?.className
      ).not.toContain('underline');
    }
  });

  it('prevents selecting 11 players without a GK', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );

    // Helper function to select a player by name
    const selectPlayer = (playerName: string) => {
      let playerElement = screen.queryByText(playerName)?.closest('div');
      const nextPageButton = screen.getByText('NEXT PAGE');
      if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      const prevPageButton = screen.getByText('PREVIOUS PAGE');
      if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      expect(playerElement).toBeTruthy();
      fireEvent.click(playerElement!);
    };

    // Select 10 outfield players (no GK)
    const outfieldPlayers = mockTeam.players
      .filter((p) => p.position !== 'GK')
      .slice(0, 10);
    outfieldPlayers.forEach((p) => selectPlayer(p.name));

    // Try to select an 11th outfield player (should not be possible)
    const extraOutfield = mockTeam.players.find(
      (p) => p.position !== 'GK' && !outfieldPlayers.includes(p)
    );
    if (extraOutfield) {
      selectPlayer(extraOutfield.name);
      const playerElement = screen
        .queryByText(extraOutfield.name)
        ?.closest('div');
      // Should not be selected
      expect(
        playerElement?.querySelector('span:first-child')?.className
      ).not.toContain('bg-[#e2e2e2]');
    }

    // Now select a GK (should be allowed as 11th player)
    selectPlayer('RICHARD');
    const gkElement = screen.queryByText('RICHARD')?.closest('div');
    expect(gkElement?.querySelector('span:first-child')?.className).toContain(
      'bg-[#e2e2e2]'
    );
  });

  it('allows any position as 11th player if a GK is already selected', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      </I18nextProvider>
    );
    // Helper function to select a player by name
    const selectPlayer = (playerName: string) => {
      let playerElement = screen.queryByText(playerName)?.closest('div');
      const nextPageButton = screen.getByText('NEXT PAGE');
      if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      const prevPageButton = screen.getByText('PREVIOUS PAGE');
      if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      expect(playerElement).toBeTruthy();
      fireEvent.click(playerElement!);
    };
    // Select a GK first
    selectPlayer('RICHARD');
    // Select 10 outfield players
    const outfieldPlayers = mockTeam.players
      .filter((p) => p.position !== 'GK')
      .slice(0, 10);
    outfieldPlayers.forEach((p) => selectPlayer(p.name));
    // All 11 should be selected (including the GK)
    let gkElement = screen.queryByText('RICHARD')?.closest('div');
    // If not found, try navigating pages
    if (!gkElement) {
      const nextPageButton = screen.getByText('NEXT PAGE');
      if (!nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        gkElement = screen.queryByText('RICHARD')?.closest('div');
      }
    }
    if (!gkElement) {
      const prevPageButton = screen.getByText('PREVIOUS PAGE');
      if (!prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        gkElement = screen.queryByText('RICHARD')?.closest('div');
      }
    }
    expect(gkElement?.querySelector('span:first-child')?.className).toContain(
      'bg-[#e2e2e2]'
    );
    outfieldPlayers.forEach((p) => {
      let el = screen.queryByText(p.name)?.closest('div');
      if (!el) {
        const nextPageButton = screen.getByText('NEXT PAGE');
        if (!nextPageButton.hasAttribute('disabled')) {
          fireEvent.click(nextPageButton);
          el = screen.queryByText(p.name)?.closest('div');
        }
      }
      if (!el) {
        const prevPageButton = screen.getByText('PREVIOUS PAGE');
        if (!prevPageButton.hasAttribute('disabled')) {
          fireEvent.click(prevPageButton);
          el = screen.queryByText(p.name)?.closest('div');
        }
      }
      expect(el?.querySelector('span:first-child')?.className).toContain(
        'bg-[#e2e2e2]'
      );
    });
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
      expect(screen.getByText(`PLAYER${i}`)).toBeTruthy();
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
      expect(screen.getByText(`PLAYER${i}`)).toBeTruthy();
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
    expect(prevBtn.hasAttribute('disabled')).toBe(true);
    expect(nextBtn.hasAttribute('disabled')).toBe(false);
    // Go to last page
    fireEvent.click(nextBtn);
    expect(prevBtn.hasAttribute('disabled')).toBe(false);
    expect(nextBtn.hasAttribute('disabled')).toBe(true);
  });
});
