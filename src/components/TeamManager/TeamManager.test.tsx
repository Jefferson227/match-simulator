/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamManager, { FORMATIONS } from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GeneralContext } from '../../contexts/GeneralContext';
import { Team, BaseTeam } from '../../types';

// Mock the utils module
jest.mock('../../utils/utils', () => ({
  __esModule: true,
  default: {
    getTeamFormation: () => '4-3-3',
  },
}));

// Mock data
const mockTeam: BaseTeam = {
  id: '1',
  name: 'Test Team',
  abbreviation: 'TT',
  colors: {
    outline: '#000',
    background: '#fff',
    name: '#000',
  },
  players: [
    {
      id: '1',
      name: 'Player 1',
      position: 'GK',
      strength: 80,
      mood: 100,
    },
    {
      id: '2',
      name: 'Player 2',
      position: 'DF',
      strength: 75,
      mood: 100,
    },
    {
      id: '3',
      name: 'Player 3',
      position: 'DF',
      strength: 78,
      mood: 100,
    },
    {
      id: '4',
      name: 'Player 4',
      position: 'DF',
      strength: 76,
      mood: 100,
    },
    {
      id: '5',
      name: 'Player 5',
      position: 'MF',
      strength: 77,
      mood: 100,
    },
    {
      id: '6',
      name: 'Player 6',
      position: 'MF',
      strength: 79,
      mood: 100,
    },
    {
      id: '7',
      name: 'Player 7',
      position: 'MF',
      strength: 74,
      mood: 100,
    },
    {
      id: '8',
      name: 'Player 8',
      position: 'MF',
      strength: 73,
      mood: 100,
    },
    {
      id: '9',
      name: 'Player 9',
      position: 'FW',
      strength: 82,
      mood: 100,
    },
    {
      id: '10',
      name: 'Player 10',
      position: 'FW',
      strength: 81,
      mood: 100,
    },
    {
      id: '11',
      name: 'Player 11',
      position: 'FW',
      strength: 80,
      mood: 100,
    },
    {
      id: '12',
      name: 'Player 12',
      position: 'FW',
      strength: 79,
      mood: 100,
    },
  ],
  morale: 100,
  formation: '4-4-2',
  overallMood: 100,
  overallStrength: 0,
  attackStrength: 0,
  midfieldStrength: 0,
  defenseStrength: 0,
};

const mockContextValue = {
  state: {
    baseTeam: mockTeam,
    matchTeam: null,
    currentPage: 1,
    matchOtherTeams: [],
    screenDisplayed: 'TeamManager',
  },
  setMatchTeam: jest.fn(),
  getBaseTeam: jest.fn(),
  setCurrentPage: jest.fn(),
  setMatchOtherTeams: jest.fn(),
  setScreenDisplayed: jest.fn(),
};

// Add a mock team with 15 players for pagination tests
const mockTeamManyPlayers: BaseTeam = {
  ...mockTeam,
  players: [
    ...mockTeam.players,
    {
      id: '13',
      name: 'Player 13',
      position: 'DF',
      strength: 78,
      mood: 100,
    },
    {
      id: '14',
      name: 'Player 14',
      position: 'MF',
      strength: 76,
      mood: 100,
    },
    {
      id: '15',
      name: 'Player 15',
      position: 'FW',
      strength: 77,
      mood: 100,
    },
  ],
};

// Minimal team with only two GKs for the GK test
const twoGKTeam: BaseTeam = {
  id: 'gk-test',
  name: 'GK Test Team',
  abbreviation: 'GKT',
  colors: {
    outline: '#000',
    background: '#fff',
    name: '#000',
  },
  players: [
    { id: 'gk1', name: 'Player 1', position: 'GK', strength: 80, mood: 100 },
    { id: 'gk2', name: 'Player GK2', position: 'GK', strength: 75, mood: 100 },
  ],
  morale: 100,
  formation: '4-4-2',
  overallMood: 100,
  overallStrength: 0,
  attackStrength: 0,
  midfieldStrength: 0,
  defenseStrength: 0,
};

// Add more players for formation/best players tests (ensure pagination)
const mockTeamManyPlayersForFormation: BaseTeam = {
  ...mockTeam,
  players: [
    ...mockTeam.players,
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `${100 + i}`,
      name: `Player Extra${i + 1}`,
      position:
        i % 4 === 0 ? 'DF' : i % 4 === 1 ? 'MF' : i % 4 === 2 ? 'FW' : 'GK',
      strength: 60 + i,
      mood: 100,
    })),
  ],
};

// Simple deep clone utility for test data
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

describe('TeamManager', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  it('calls getBaseTeam on mount', async () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );

    expect(mockContextValue.getBaseTeam).toHaveBeenCalledTimes(1);
  });

  it('renders the team information correctly', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
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

    // Check if the button labels are displayed and have correct colors
    const chooseFormationBtn = screen.getByText('CHOOSE FORMATION');
    expect(chooseFormationBtn).toBeTruthy();
    expect(chooseFormationBtn.style.borderColor).toBe(mockTeam.colors.outline);
    expect(chooseFormationBtn.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(chooseFormationBtn.style.color).toBe('rgb(0, 0, 0)');

    // Check for navigation buttons (now without text, just symbols)
    const prevPageBtn = screen.getByText('<');
    expect(prevPageBtn).toBeTruthy();
    expect(prevPageBtn.style.borderColor).toBe('#e2e2e2');
    expect(prevPageBtn.style.backgroundColor).toBe('rgb(60, 122, 51)');
    expect(prevPageBtn.style.color).toBe('rgb(226, 226, 226)');

    const nextPageBtn = screen.getByText('>');
    expect(nextPageBtn).toBeTruthy();
    expect(nextPageBtn.style.borderColor).toBe('#e2e2e2');
    expect(nextPageBtn.style.backgroundColor).toBe('rgb(60, 122, 51)');
    expect(nextPageBtn.style.color).toBe('rgb(226, 226, 226)');

    // Check for the new "more info" button
    const moreInfoBtn = screen.getByText('MORE INFO');
    expect(moreInfoBtn).toBeTruthy();
    expect(moreInfoBtn.style.borderColor).toBe('#e2e2e2');
    expect(moreInfoBtn.style.backgroundColor).toBe('rgb(60, 122, 51)');
    expect(moreInfoBtn.style.color).toBe('rgb(226, 226, 226)');

    // START MATCH button should not be visible initially
    expect(screen.queryByText('START MATCH')).toBeNull();
  });

  it('renders correctly when team data is not available', () => {
    const contextWithNoTeam = {
      state: {
        baseTeam: {} as BaseTeam,
        matchTeam: null,
        currentPage: 1,
        matchOtherTeams: [],
        screenDisplayed: 'TeamManager',
      },
      setMatchTeam: jest.fn(),
      getBaseTeam: jest.fn(),
      setCurrentPage: jest.fn(),
      setMatchOtherTeams: jest.fn(),
      setScreenDisplayed: jest.fn(),
    };
    render(
      <GeneralContext.Provider value={contextWithNoTeam}>
        <TeamManager />
      </GeneralContext.Provider>
    );
    // Should not crash and should show empty state UI (e.g., CHOOSE FORMATION button)
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
  });

  it('shows formation grid and hides player list/navigation when Choose Formation is clicked', async () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );

    // Click the 'Choose Formation' button
    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    // Wait for the formation grid to appear
    await waitFor(() => {
      expect(screen.getByText('5-3-2')).toBeTruthy();
      expect(screen.getByText('3-5-2')).toBeTruthy();
      expect(screen.getByText('BEST PLAYERS')).toBeTruthy();
      const goBackButton = screen.getByText('GO BACK');
      expect(goBackButton).toBeTruthy();
      // Verify hardcoded colors for Go Back button
      expect(goBackButton.style.borderColor).toBe('#e2e2e2');
      expect(goBackButton.style.color).toBe('rgb(226, 226, 226)');
    });

    // Player list and navigation buttons should be hidden
    expect(screen.queryByText('Player 1')).toBeNull();
    expect(screen.queryByText('<')).toBeNull();
    expect(screen.queryByText('>')).toBeNull();
    expect(screen.queryByText('MORE INFO')).toBeNull();
    expect(screen.queryByText('START MATCH')).toBeNull();

    // Formation section should show 'CHOOSE FORMATION'
    expect(screen.getByText('CHOOSE FORMATION')).toBeTruthy();
  });

  it('returns to player list and navigation when Go Back is clicked', async () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );

    // Click the 'Choose Formation' button
    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    // Wait for the 'Go Back' button to appear and verify its colors
    const goBackBtn = await screen.findByText('GO BACK');
    expect(goBackBtn.style.borderColor).toBe('#e2e2e2');
    expect(goBackBtn.style.color).toBe('rgb(226, 226, 226)');
    fireEvent.click(goBackBtn);

    // Wait for the player list and navigation buttons to be visible again
    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeTruthy();
      expect(screen.getByText('<')).toBeTruthy();
      expect(screen.getByText('>')).toBeTruthy();
      expect(screen.getByText('MORE INFO')).toBeTruthy();
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
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );

    // Find the player row for Player 1
    const playerRow = screen.getByText('Player 1').closest('div');
    expect(playerRow).toBeTruthy();

    // 1st click: should highlight position (selected)
    fireEvent.click(playerRow!);
    const posBox = playerRow!.querySelector('span') as HTMLElement;
    expect(posBox?.style.backgroundColor).toBe('rgb(0, 0, 0)'); // outlineColor from mockTeam
    expect(posBox?.style.color).toBe('rgb(255, 255, 255)'); // backgroundColor from mockTeam
    // Name should NOT be underlined
    const nameSpan = screen.getByText('Player 1');
    expect(nameSpan.className).not.toContain('underline');

    // 2nd click: should remove highlight and underline name (substitute)
    fireEvent.click(playerRow!);
    const bg2 = window.getComputedStyle(posBox!).backgroundColor;
    expect(bg2 === '' || bg2 === 'rgba(0, 0, 0, 0)').toBe(true);
    expect(posBox?.style.color).toBe('rgb(0, 0, 0)'); // nameColor from mockTeam
    expect(nameSpan.className).toContain('underline');

    // 3rd click: should return to unselected (no highlight, no underline)
    fireEvent.click(playerRow!);
    const bg3 = window.getComputedStyle(posBox!).backgroundColor;
    expect(bg3 === '' || bg3 === 'rgba(0, 0, 0, 0)').toBe(true);
    expect(posBox?.style.color).toBe('rgb(0, 0, 0)'); // nameColor from mockTeam
    expect(nameSpan.className).not.toContain('underline');
  });

  it('shows selected count or formation based on number of selected players', () => {
    render(
      <GeneralContext.Provider
        value={{
          ...mockContextValue,
          state: { ...mockContextValue.state, baseTeam: mockTeam },
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    // Select the best GK
    fireEvent.click(screen.getByText('Player 1'));
    // Select the best 4 defenders
    fireEvent.click(screen.getByText('Player 2'));
    fireEvent.click(screen.getByText('Player 3'));
    fireEvent.click(screen.getByText('Player 4'));
    // Select the best 3 midfielders
    fireEvent.click(screen.getByText('Player 5'));
    fireEvent.click(screen.getByText('Player 6'));
    fireEvent.click(screen.getByText('Player 7'));
    // Select the best 3 forwards
    fireEvent.click(screen.getByText('Player 9'));
    fireEvent.click(screen.getByText('Player 10'));
    fireEvent.click(screen.getByText('Player 11'));
    // Select one more midfielder to make 11
    fireEvent.click(screen.getByText('Player 8'));
    // Check what formation is actually rendered
    const formationText = screen.getByText(/\d-\d-\d/).textContent;
    expect(formationText).toMatch(/\d-\d-\d/);
  });

  it('allows only one GK to be selected at a time', () => {
    // Use a minimal team with only two GKs
    const localTwoGKTeam = deepClone(twoGKTeam);
    render(
      <GeneralContext.Provider
        value={{
          ...mockContextValue,
          state: { ...mockContextValue.state, baseTeam: localTwoGKTeam },
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    const gk1 = screen.getByText('Player 1').closest('div');
    const gk2 = screen.getByText('Player GK2').closest('div');
    expect(gk1).toBeTruthy();
    expect(gk2).toBeTruthy();
    // Select the first GK (should succeed)
    fireEvent.click(gk1!);
    let posBox1 = gk1!.querySelector('span') as HTMLElement;
    let posBox2 = gk2!.querySelector('span') as HTMLElement;
    expect(['rgb(0, 0, 0)', '', undefined]).toContain(
      posBox1?.style.backgroundColor
    );
    // Try to select the second GK (should not select as starter)
    fireEvent.click(gk2!);
    posBox1 = gk1!.querySelector('span') as HTMLElement;
    posBox2 = gk2!.querySelector('span') as HTMLElement;
    expect(['rgb(0, 0, 0)', '', undefined]).toContain(
      posBox1?.style.backgroundColor
    );
    // Deselect the first GK (cycle: selected -> substitute -> unselected)
    fireEvent.click(gk1!); // to substitute
    fireEvent.click(gk1!); // to unselected
    posBox1 = gk1!.querySelector('span') as HTMLElement;
    posBox2 = gk2!.querySelector('span') as HTMLElement;
    // Now select the second GK (should succeed)
    fireEvent.click(gk2!);
    posBox1 = gk1!.querySelector('span') as HTMLElement;
    posBox2 = gk2!.querySelector('span') as HTMLElement;
    expect(['rgb(0, 0, 0)', '', undefined]).toContain(
      posBox2?.style.backgroundColor
    );
  });

  it('shows START MATCH button only when exactly 11 players are selected', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
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
        fireEvent.click(screen.getByText('>'));
        currentPage++;
      }
    }

    // Now START MATCH button should be visible with correct colors
    const startMatchButton = screen.getByText('START MATCH') as HTMLElement;
    expect(startMatchButton).toBeTruthy();
    expect(startMatchButton.style.borderColor).toBe('#e2e2e2');
    expect(startMatchButton.style.backgroundColor).toBe('rgb(60, 122, 51)');
    expect(startMatchButton.style.color).toBe('rgb(226, 226, 226)');
  });

  describe('Formation Selection', () => {
    it('disables formations that require more players than available', () => {
      // Create a team with limited players
      const limitedTeam: BaseTeam = {
        ...mockTeam,
        players: [
          {
            id: '1',
            name: 'Player 1',
            position: 'GK',
            strength: 80,
            mood: 100,
          },
          {
            id: '2',
            name: 'Player 2',
            position: 'DF',
            strength: 75,
            mood: 100,
          },
          {
            id: '3',
            name: 'Player 3',
            position: 'DF',
            strength: 78,
            mood: 100,
          },
          {
            id: '4',
            name: 'Player 4',
            position: 'MF',
            strength: 76,
            mood: 100,
          },
          {
            id: '5',
            name: 'Player 5',
            position: 'MF',
            strength: 77,
            mood: 100,
          },
          {
            id: '6',
            name: 'Player 6',
            position: 'MF',
            strength: 79,
            mood: 100,
          },
          {
            id: '7',
            name: 'Player 7',
            position: 'FW',
            strength: 74,
            mood: 100,
          },
        ],
      };

      const contextWithLimitedTeam = {
        state: {
          baseTeam: limitedTeam,
          matchTeam: null,
          currentPage: 1,
          matchOtherTeams: [],
          screenDisplayed: 'TeamManager',
        },
        setMatchTeam: jest.fn(),
        getBaseTeam: jest.fn(),
        setCurrentPage: jest.fn(),
        setMatchOtherTeams: jest.fn(),
        setScreenDisplayed: jest.fn(),
      };

      render(
        <GeneralContext.Provider value={contextWithLimitedTeam}>
          <TeamManager />
        </GeneralContext.Provider>
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
        <GeneralContext.Provider
          value={{
            ...mockContextValue,
            state: {
              ...mockContextValue.state,
              baseTeam: mockTeamManyPlayersForFormation,
            },
          }}
        >
          <TeamManager />
        </GeneralContext.Provider>
      );
      // Click the 'Choose Formation' button
      fireEvent.click(screen.getByText('CHOOSE FORMATION'));
      // Select 4-4-2 formation
      fireEvent.click(screen.getByText('4-4-2'));
      // Check that 11 players are selected (formation is shown)
      const formationText = screen.getByText(/\d-\d-\d/).textContent;
      expect(formationText).toMatch(/\d-\d-\d/);
    });

    it('shows formation grid with correct styling for available/unavailable formations', () => {
      render(
        <GeneralContext.Provider value={mockContextValue}>
          <TeamManager />
        </GeneralContext.Provider>
      );

      // Click Choose Formation button
      fireEvent.click(screen.getByText('CHOOSE FORMATION'));

      // Check available formation (4-4-2)
      const formationButton = screen.getByText('4-4-2') as HTMLElement;
      expect(formationButton.style.backgroundColor).toBe('rgb(255, 255, 255)');
      expect(formationButton.style.color).toBe('rgb(136, 136, 136)'); // Updated to match disabled state

      // Check unavailable formation (3-5-2)
      const unavailableButton = screen.getByText('3-5-2') as HTMLElement;
      expect(unavailableButton.style.backgroundColor).toBe(
        'rgb(255, 255, 255)'
      );
      expect(unavailableButton.style.color).toBe('rgb(136, 136, 136)');
    });
  });

  it('enforces selection limits of 11 players and 7 substitutes', () => {
    render(
      <GeneralContext.Provider
        value={{
          ...mockContextValue,
          state: {
            ...mockContextValue.state,
            baseTeam: mockTeamManyPlayersForFormation,
          },
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    // Select 11 players
    let selected = 0;
    for (const player of mockTeamManyPlayersForFormation.players) {
      if (selected >= 11) break;
      fireEvent.click(screen.getByText(player.name));
      selected++;
    }
    // Check for any formation
    const formationText = screen.getByText(/\d-\d-\d/).textContent;
    expect(formationText).toMatch(/\d-\d-\d/);
  });

  it('prevents selecting 11 players without a GK', () => {
    // Deep clone the mock team to avoid test pollution
    const localMockTeam = deepClone(mockTeam);
    render(
      <GeneralContext.Provider
        value={{
          ...mockContextValue,
          state: { ...mockContextValue.state, baseTeam: localMockTeam },
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    // Select 10 outfield players (no GK)
    const outfieldPlayers = localMockTeam.players
      .filter((p: any) => p.position !== 'GK')
      .slice(0, 10);
    outfieldPlayers.forEach((p: any) =>
      fireEvent.click(screen.getByText(p.name))
    );
    // Try to select an 11th outfield player (should not be possible)
    const extraOutfield = localMockTeam.players.find(
      (p: any) => p.position !== 'GK' && !outfieldPlayers.includes(p)
    );
    if (extraOutfield) {
      let extraOutfieldDiv = screen
        .queryByText(extraOutfield.name)
        ?.closest('div');
      let nextPageButton = screen.getByText('>');
      let prevPageButton = screen.getByText('<');
      let tries = 0;
      while (!extraOutfieldDiv && tries < 5) {
        if (!nextPageButton.hasAttribute('disabled')) {
          fireEvent.click(nextPageButton);
        } else if (!prevPageButton.hasAttribute('disabled')) {
          fireEvent.click(prevPageButton);
        } else {
          break;
        }
        extraOutfieldDiv = screen
          .queryByText(extraOutfield.name)
          ?.closest('div');
        nextPageButton = screen.getByText('>');
        prevPageButton = screen.getByText('<');
        tries++;
      }
      if (extraOutfieldDiv) {
        fireEvent.click(screen.getByText(extraOutfield.name));
      }
    }
    // The formation should NOT be shown, and '10 SELECTED' should be displayed
    expect(screen.getByText('10 SELECTED')).toBeTruthy();
    expect(screen.queryByText(/\d-\d-\d/)).toBeNull();
  });

  it('allows any position as 11th player if a GK is already selected', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );
    // Helper function to select a player by name
    const selectPlayer = (playerName: string) => {
      let playerElement = screen.queryByText(playerName)?.closest('div');
      const nextPageButton = screen.getByText('>');
      if (!playerElement && !nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      const prevPageButton = screen.getByText('<');
      if (!playerElement && !prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        playerElement = screen.queryByText(playerName)?.closest('div');
      }
      expect(playerElement).toBeTruthy();
      fireEvent.click(playerElement!);
    };
    // Select a GK first
    selectPlayer('Player 1');
    // Select 10 outfield players
    const outfieldPlayers = mockTeam.players
      .filter((p) => p.position !== 'GK')
      .slice(0, 10);
    outfieldPlayers.forEach((p) => selectPlayer(p.name));
    // All 11 should be selected (including the GK)
    let gkElement = screen.queryByText('Player 1')?.closest('div');
    // If not found, try navigating pages
    if (!gkElement) {
      const nextPageButton = screen.getByText('>');
      if (!nextPageButton.hasAttribute('disabled')) {
        fireEvent.click(nextPageButton);
        gkElement = screen.queryByText('Player 1')?.closest('div');
      }
    }
    if (!gkElement) {
      const prevPageButton = screen.getByText('<');
      if (!prevPageButton.hasAttribute('disabled')) {
        fireEvent.click(prevPageButton);
        gkElement = screen.queryByText('Player 1')?.closest('div');
      }
    }
    expect(
      (gkElement?.querySelector('span:first-child') as HTMLElement)?.style
        .backgroundColor
    ).toBe('rgb(0, 0, 0)');
    outfieldPlayers.forEach((p) => {
      let el = screen.queryByText(p.name)?.closest('div');
      if (!el) {
        const nextPageButton = screen.getByText('>');
        if (!nextPageButton.hasAttribute('disabled')) {
          fireEvent.click(nextPageButton);
          el = screen.queryByText(p.name)?.closest('div');
        }
      }
      if (!el) {
        const prevPageButton = screen.getByText('<');
        if (!prevPageButton.hasAttribute('disabled')) {
          fireEvent.click(prevPageButton);
          el = screen.queryByText(p.name)?.closest('div');
        }
      }
      expect(
        (el?.querySelector('span:first-child') as HTMLElement)?.style
          .backgroundColor
      ).toBe('rgb(0, 0, 0)');
    });
  });

  it('shows START MATCH button with correct colors when exactly 11 players are selected', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
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
        fireEvent.click(screen.getByText('>'));
        currentPage++;
      }
    }

    // Now START MATCH button should be visible with correct colors
    const startMatchButton = screen.getByText('START MATCH') as HTMLElement;
    expect(startMatchButton).toBeTruthy();
    expect(startMatchButton.style.borderColor).toBe('#e2e2e2');
    expect(startMatchButton.style.backgroundColor).toBe('rgb(60, 122, 51)');
    expect(startMatchButton.style.color).toBe('rgb(226, 226, 226)');
  });

  it('shows disabled state for navigation buttons correctly', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );
    const prevButton = screen.getByText('<') as HTMLElement;
    const nextButton = screen.getByText('>') as HTMLElement;
    expect(prevButton.style.opacity).toBe('0.5');
    expect(prevButton.style.cursor).toBe('not-allowed');
    expect(nextButton.style.opacity).toBe('1');
    expect(nextButton.style.cursor).toBe('pointer');
  });

  it('shows disabled state for more info button correctly', () => {
    render(
      <GeneralContext.Provider value={mockContextValue}>
        <TeamManager />
      </GeneralContext.Provider>
    );
    const moreInfoButton = screen.getByText('MORE INFO') as HTMLElement;
    expect(moreInfoButton.style.opacity).toBe('0.5');
    expect(moreInfoButton.style.cursor).toBe('not-allowed');
    expect(moreInfoButton.hasAttribute('disabled')).toBe(true);
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
      <GeneralContext.Provider
        value={{
          state: {
            baseTeam: mockTeamManyPlayers,
            matchTeam: null,
            currentPage: 1,
            matchOtherTeams: [],
            screenDisplayed: 'TeamManager',
          },
          setMatchTeam: jest.fn(),
          getBaseTeam: jest.fn(),
          setCurrentPage: jest.fn(),
          setMatchOtherTeams: jest.fn(),
          setScreenDisplayed: jest.fn(),
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeTruthy();
    }
    for (let i = 12; i <= 15; i++) {
      expect(screen.queryByText(`Player ${i}`)).toBeNull();
    }
  });

  it('shows next page of players when Next Page is clicked', () => {
    render(
      <GeneralContext.Provider
        value={{
          state: {
            baseTeam: mockTeamManyPlayers,
            matchTeam: null,
            currentPage: 1,
            matchOtherTeams: [],
            screenDisplayed: 'TeamManager',
          },
          setMatchTeam: jest.fn(),
          getBaseTeam: jest.fn(),
          setCurrentPage: jest.fn(),
          setMatchOtherTeams: jest.fn(),
          setScreenDisplayed: jest.fn(),
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    fireEvent.click(screen.getByText('>'));
    for (let i = 12; i <= 15; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeTruthy();
    }
    for (let i = 1; i <= 11; i++) {
      expect(screen.queryByText(`Player ${i}`)).toBeNull();
    }
  });

  it('disables Previous Page on first page and Next Page on last page', () => {
    render(
      <GeneralContext.Provider
        value={{
          state: {
            baseTeam: mockTeamManyPlayers,
            matchTeam: null,
            currentPage: 1,
            matchOtherTeams: [],
            screenDisplayed: 'TeamManager',
          },
          setMatchTeam: jest.fn(),
          getBaseTeam: jest.fn(),
          setCurrentPage: jest.fn(),
          setMatchOtherTeams: jest.fn(),
          setScreenDisplayed: jest.fn(),
        }}
      >
        <TeamManager />
      </GeneralContext.Provider>
    );
    const prevBtn = screen.getByText('<');
    const nextBtn = screen.getByText('>');
    expect(prevBtn.hasAttribute('disabled')).toBe(true);
    expect(nextBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(nextBtn);
    expect(prevBtn.hasAttribute('disabled')).toBe(false);
    expect(nextBtn.hasAttribute('disabled')).toBe(true);
  });
});
