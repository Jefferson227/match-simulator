/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamManager from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import type { GameState } from '../../game-engine/GameState';
import type { Championship } from '../../domain/models/Championship';
import type { Team } from '../../domain/models/Team';
import type Player from '../../domain/models/Player';

const makePlayer = (id: string, name: string, position: Player['position'], strength: number) => ({
  id: id as Player['id'],
  name,
  position,
  strength,
  xp: 0,
  isStarter: false,
  isSub: false,
});

const basePlayers: Player[] = [
  makePlayer('p-1-1-1-1', 'Player 1', 'GK', 80),
  makePlayer('p-2-2-2-2', 'Player 2', 'DF', 75),
  makePlayer('p-3-3-3-3', 'Player 3', 'DF', 78),
  makePlayer('p-4-4-4-4', 'Player 4', 'DF', 72),
  makePlayer('p-5-5-5-5', 'Player 5', 'DF', 76),
  makePlayer('p-6-6-6-6', 'Player 6', 'MF', 82),
  makePlayer('p-7-7-7-7', 'Player 7', 'MF', 79),
  makePlayer('p-8-8-8-8', 'Player 8', 'MF', 81),
  makePlayer('p-9-9-9-9', 'Player 9', 'MF', 77),
  makePlayer('p-10-10-10-10', 'Player 10', 'FW', 85),
  makePlayer('p-11-11-11-11', 'Player 11', 'FW', 83),
  makePlayer('p-12-12-12-12', 'Player 12', 'FW', 80),
];

const createTeam = (players: Player[], overrides: Partial<Team> = {}): Team => ({
  id: 'team-1-1-1-1' as Team['id'],
  fullName: 'Test Team',
  shortName: 'TEST',
  abbreviation: 'TST',
  colors: {
    outline: '#000',
    background: '#fff',
    text: '#000',
  },
  players,
  morale: 100,
  isControlledByHuman: true,
  ...overrides,
});

const createChampionship = (teams: Team[]): Championship => ({
  id: 'championship-1',
  name: 'Test Championship',
  internalName: 'test-championship',
  numberOfTeams: teams.length,
  teams,
  standings: [],
  matchContainer: {
    timer: 0,
    currentSeason: 2024,
    currentRound: 1,
    totalRounds: 1,
    matches: [],
  },
  type: 'double-round-robin',
  hasTeamControlledByHuman: true,
  isPromotable: false,
  isRelegatable: false,
});

const createState = (teams: Team[]): GameState => ({
  championshipContainer: {
    playableChampionship: createChampionship(teams),
  },
  hasError: false,
  errorMessage: '',
  currentScreen: 'TeamManager',
});

const renderTeamManager = (teams: Team[]) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider initialState={createState(teams)}>
        <TeamManager />
      </GameEngineProvider>
    </I18nextProvider>
  );

describe('TeamManager', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  it('renders the team information and player list', () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    const teamNameElement = screen.getByText(team.fullName);
    expect(teamNameElement).toBeTruthy();
    expect(teamNameElement.className).toContain('uppercase');

    expect(screen.getByText('0 SELECTED')).toBeTruthy();

    const firstPagePlayers = team.players.slice(0, 11);
    firstPagePlayers.forEach((player) => {
      const playerElement = screen.getByText(player.name).closest('div');
      expect(playerElement).toBeTruthy();
      expect(playerElement?.textContent).toContain(player.position);
      expect(playerElement?.textContent).toContain(player.strength.toString());
    });

    const chooseFormationBtn = screen.getByText('CHOOSE FORMATION') as HTMLElement;
    expect(chooseFormationBtn.style.borderColor).toBe(team.colors.outline);
    expect(chooseFormationBtn.style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(chooseFormationBtn.style.color).toBe('rgb(0, 0, 0)');
  });

  it('shows formation grid and hides player list when Choose Formation is clicked', async () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    await waitFor(() => {
      expect(screen.getByText('5-3-2')).toBeTruthy();
      expect(screen.getByText('3-5-2')).toBeTruthy();
      expect(screen.getByText('BEST PLAYERS')).toBeTruthy();
      expect(screen.getByText('GO BACK')).toBeTruthy();
    });

    expect(screen.queryByText('Player 1')).toBeNull();
    expect(screen.queryByText('<')).toBeNull();
    expect(screen.queryByText('>')).toBeNull();
  });

  it('returns to player list and navigation when Go Back is clicked', async () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    const goBackBtn = await screen.findByText('GO BACK');
    fireEvent.click(goBackBtn);

    await waitFor(() => {
      expect(screen.getByText('Player 1')).toBeTruthy();
      expect(screen.getByText('<')).toBeTruthy();
      expect(screen.getByText('>')).toBeTruthy();
      expect(screen.queryByText('5-3-2')).toBeNull();
    });
  });

  it('cycles player selection through unselected, selected, substitute, and back', () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    const playerRow = screen.getByText('Player 1').closest('div');
    expect(playerRow).toBeTruthy();

    fireEvent.click(playerRow!);
    const posBox = playerRow!.querySelector('span') as HTMLElement;
    expect(posBox?.style.backgroundColor).toBe('rgb(0, 0, 0)');
    expect(posBox?.style.color).toBe('rgb(255, 255, 255)');
    const nameSpan = screen.getByText('Player 1');
    expect(nameSpan.className).not.toContain('underline');

    fireEvent.click(playerRow!);
    const bg2 = window.getComputedStyle(posBox!).backgroundColor;
    expect(bg2 === '' || bg2 === 'rgba(0, 0, 0, 0)').toBe(true);
    expect(nameSpan.className).toContain('underline');

    fireEvent.click(playerRow!);
    const bg3 = window.getComputedStyle(posBox!).backgroundColor;
    expect(bg3 === '' || bg3 === 'rgba(0, 0, 0, 0)').toBe(true);
    expect(nameSpan.className).not.toContain('underline');
  });

  it('allows only one GK to be selected at a time', () => {
    const gkTeam = createTeam([
      makePlayer('gk-1-1-1-1', 'Player 1', 'GK', 80),
      makePlayer('gk-2-2-2-2', 'Player GK2', 'GK', 75),
    ]);

    renderTeamManager([gkTeam]);

    const gk1 = screen.getByText('Player 1').closest('div');
    const gk2 = screen.getByText('Player GK2').closest('div');
    expect(gk1).toBeTruthy();
    expect(gk2).toBeTruthy();

    fireEvent.click(gk1!);
    const gk1Span = gk1!.querySelector('span') as HTMLElement;
    expect(gk1Span.style.backgroundColor).toBe('rgb(0, 0, 0)');

    fireEvent.click(gk2!);
    const gk2Span = gk2!.querySelector('span') as HTMLElement;
    expect(gk2Span.style.backgroundColor).toBe('');

    expect(gk1Span.style.backgroundColor).toBe('rgb(0, 0, 0)');
  });

  it('shows START MATCH button only when exactly 11 players are selected', async () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    const startMatchButton = screen.getByText('START MATCH');
    expect(startMatchButton.parentElement).toHaveClass('invisible');

    team.players.slice(0, 11).forEach((player) => {
      fireEvent.click(screen.getByText(player.name));
    });

    await waitFor(() => {
      expect(startMatchButton.parentElement).toHaveClass('visible');
    });

    expect(startMatchButton).toBeTruthy();
    expect(startMatchButton).toHaveStyle({
      borderColor: '#e2e2e2',
      backgroundColor: 'rgb(60, 122, 51)',
      color: 'rgb(226, 226, 226)',
    });
  });

  it('selects a formation and shows the calculated formation', async () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    fireEvent.click(screen.getByText('CHOOSE FORMATION'));
    fireEvent.click(screen.getByText('4-4-2'));

    await waitFor(() => {
      const formationText = screen.getByText(/\d-\d-\d/).textContent;
      expect(formationText).toMatch(/\d-\d-\d/);
    });
  });

  it('shows formation availability styling', () => {
    const team = createTeam(basePlayers);
    renderTeamManager([team]);

    fireEvent.click(screen.getByText('CHOOSE FORMATION'));

    const availableButton = screen.getByText('4-4-2') as HTMLElement;
    expect(availableButton.style.color).toBe('rgb(0, 0, 0)');

    const unavailableButton = screen.getByText('5-3-2') as HTMLElement;
    expect(unavailableButton.style.color).toBe('rgb(136, 136, 136)');
  });
});

describe('TeamManager pagination', () => {
  it('shows only 11 players per page and navigates pages', () => {
    const manyPlayers = [
      ...basePlayers,
      makePlayer('p-13-13-13-13', 'Player 13', 'DF', 78),
      makePlayer('p-14-14-14-14', 'Player 14', 'MF', 76),
      makePlayer('p-15-15-15-15', 'Player 15', 'FW', 77),
    ];
    const team = createTeam(manyPlayers);

    renderTeamManager([team]);

    for (let i = 1; i <= 11; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeTruthy();
    }
    for (let i = 12; i <= 15; i++) {
      expect(screen.queryByText(`Player ${i}`)).toBeNull();
    }

    fireEvent.click(screen.getByText('>'));
    for (let i = 12; i <= 15; i++) {
      expect(screen.getByText(`Player ${i}`)).toBeTruthy();
    }
    for (let i = 1; i <= 11; i++) {
      expect(screen.queryByText(`Player ${i}`)).toBeNull();
    }

    const prevBtn = screen.getByText('<') as HTMLElement;
    const nextBtn = screen.getByText('>') as HTMLElement;
    expect(prevBtn.style.opacity).toBe('1');
    expect(nextBtn.style.opacity).toBe('0.5');
  });
});
