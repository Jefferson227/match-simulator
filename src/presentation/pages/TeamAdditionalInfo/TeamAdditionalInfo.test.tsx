import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it } from '@jest/globals';
import TeamAdditionalInfo from './TeamAdditionalInfo';
import i18n from '../../../i18n';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import type { GameState } from '../../../game-engine/GameState';
import type { Championship } from '../../../domain/models/Championship';
import type { Team } from '../../../domain/models/Team';
import type Round from '../../../domain/models/Round';
import type Standing from '../../../domain/models/Standing';
import { containerOf } from '../../../../tests/support/containerOf';

const createTeam = (id: string, shortName: string, isControlledByHuman: boolean): Team => ({
  id: id as Team['id'],
  fullName: `${shortName} FC`,
  shortName,
  abbreviation: shortName.slice(0, 3).toUpperCase(),
  colors: { outline: '#000', background: '#fff', text: '#000' },
  players: [],
  morale: 50,
  isControlledByHuman,
});

const human = createTeam('team-1-1-1-1', 'Human', true);
const opponent = createTeam('team-2-2-2-2', 'Rival', false);

const standing = (team: Team, position: number): Standing => ({
  team,
  position,
  wins: 4,
  draws: 3,
  losses: 2,
  goalsFor: 10,
  goalsAgainst: 7,
  points: 15,
});

const round: Round = {
  id: 'round-5',
  number: 5,
  status: 'not-started',
  matches: [
    {
      id: 'match-1',
      homeTeam: human,
      homeTeamScore: 0,
      awayTeam: opponent,
      awayTeamScore: 0,
      scorers: [],
    },
  ],
} as unknown as Round;

const createState = (humanPosition: number, opponentPosition: number): GameState =>
  ({
    championshipContainer: containerOf({
      id: 'championship-1',
      name: 'Série B',
      internalName: 'test-championship',
      numberOfTeams: 2,
      teams: [human, opponent],
      standings: [standing(human, humanPosition), standing(opponent, opponentPosition)],
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 5,
        totalRounds: 38,
        rounds: [round],
      },
      type: 'double-round-robin',
      leagueType: 'mens',
      hasTeamControlledByHuman: true,
      isPromotable: false,
      isRelegatable: false,
    } as unknown as Championship),
    hasError: false,
    errorMessage: '',
    leagueType: 'mens',
    coachName: '',
    currentScreen: 'TeamAdditionalInfo',
    gameConfig: { clockSpeed: 1000 },
  }) as unknown as GameState;

const renderInfo = (humanPosition = 1, opponentPosition = 2) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider initialState={createState(humanPosition, opponentPosition)}>
        <TeamAdditionalInfo />
      </GameEngineProvider>
    </I18nextProvider>
  );

describe('TeamAdditionalInfo', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders the first page labels in English', () => {
    renderInfo();

    ['MORALE', 'CHAMPIONSHIP', 'SEASON', 'ROUND', 'NEXT MATCH', 'LOCATION'].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy()
    );
    expect(screen.getAllByText('POSITION')).toHaveLength(2);
    expect(screen.getByText('5 OF 38')).toBeTruthy();
    expect(screen.getByText('1ST PLACE')).toBeTruthy();
    expect(screen.getByText('2ND PLACE')).toBeTruthy();
    expect(screen.getByText('HOME')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'BACK' })).toBeTruthy();
  });

  it.each([
    [3, '3RD PLACE'],
    [4, '4TH PLACE'],
    [11, '11TH PLACE'],
    [12, '12TH PLACE'],
    [13, '13TH PLACE'],
    [21, '21ST PLACE'],
    [22, '22ND PLACE'],
  ])('renders position %i as %s in English', (position, text) => {
    renderInfo(position, 1);

    expect(screen.getByText(text)).toBeTruthy();
  });

  it('renders the second page labels in English', () => {
    renderInfo();

    fireEvent.click(screen.getByText('>'));

    [
      'TEAM PERFORMANCE',
      'WINS',
      'DRAWS',
      'LOSSES',
      'POINTS',
      'GOALS FOR',
      'GOALS AGAINST',
      'NEXT OPPONENT',
      'TEAM',
    ].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('renders every label in Brazilian Portuguese', async () => {
    await i18n.changeLanguage('pt-BR');
    renderInfo(1, 11);

    ['MORAL', 'CAMPEONATO', 'TEMPORADA', 'RODADA', 'PRÓXIMO JOGO', 'LOCAL', 'CASA'].forEach(
      (label) => expect(screen.getByText(label)).toBeTruthy()
    );
    expect(screen.getByText('5 DE 38')).toBeTruthy();
    expect(screen.getByText('1º LUGAR')).toBeTruthy();
    expect(screen.getByText('11º LUGAR')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'VOLTAR' })).toBeTruthy();

    fireEvent.click(screen.getByText('>'));

    [
      'DESEMPENHO',
      'VITÓRIAS',
      'EMPATES',
      'DERROTAS',
      'PONTOS',
      'GOLS PRÓ',
      'GOLS CONTRA',
      'PRÓXIMO ADVERSÁRIO',
      'TIME',
    ].forEach((label) => expect(screen.getByText(label)).toBeTruthy());
  });

  it('switches language without a remount', async () => {
    renderInfo();
    expect(screen.getByText('MORALE')).toBeTruthy();

    await act(async () => {
      await i18n.changeLanguage('pt-BR');
    });

    expect(screen.getByText('MORAL')).toBeTruthy();
    expect(screen.queryByText('MORALE')).toBeNull();
  });
});
