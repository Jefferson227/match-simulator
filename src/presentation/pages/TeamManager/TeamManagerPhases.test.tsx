/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import TeamManager from './TeamManager';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { GameEngineProvider } from '../../contexts/GameEngineContext';
import type { GameState } from '../../../game-engine/GameState';
import type { Championship } from '../../../domain/models/Championship';
import type ChampionshipPhase from '../../../domain/models/ChampionshipPhase';
import type Match from '../../../domain/models/Match';
import type Round from '../../../domain/models/Round';
import type Standing from '../../../domain/models/Standing';
import type { Team } from '../../../domain/models/Team';
import { containerOf } from '../../../../tests/support/containerOf';

const buildTeam = (index: number, isControlledByHuman = false): Team => ({
  id: `team-${index}` as Team['id'],
  fullName: `Team ${index}`,
  shortName: `T${index}`,
  abbreviation: `T0${index}`,
  colors: { outline: '#111111', background: '#222222', text: '#ffffff' },
  players: [],
  morale: 50,
  isControlledByHuman,
});

const teams = [buildTeam(1, true), buildTeam(2), buildTeam(3), buildTeam(4)];

const buildStanding = (team: Team, position: number): Standing => ({
  team,
  position,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

const buildMatch = (fields: Partial<Match> & { homeTeam: Team; awayTeam: Team }): Match => ({
  id: `match-${fields.homeTeam.id}-${fields.awayTeam.id}-${fields.leg ?? 1}`,
  homeTeamScore: 0,
  awayTeamScore: 0,
  scorers: [],
  ...fields,
});

const groupPhase: ChampionshipPhase = {
  kind: 'round-robin',
  name: '1ª Fase',
  numberOfGroups: 2,
  teamsPerGroup: 2,
  legs: 1,
  advancingPerGroup: 1,
};

const knockoutPhase: ChampionshipPhase = {
  kind: 'knockout',
  name: 'Quartas de Final',
  numberOfTies: 1,
  legs: 2,
  secondLegHost: 'accumulated-points',
  tiebreakers: ['goal-difference', 'penalties'],
};

const buildState = (championship: Partial<Championship>): GameState =>
  ({
    championshipContainer: containerOf({
      id: 'championship',
      name: 'Brasileirão Série D',
      internalName: 'mock',
      numberOfTeams: teams.length,
      teams,
      standings: [],
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 1,
        totalRounds: 20,
        rounds: [],
      },
      type: 'group-stage-knockout',
      leagueType: 'mens',
      hasTeamControlledByHuman: true,
      isPromotable: false,
      isRelegatable: false,
      ...championship,
    } as Championship),
    hasError: false,
    errorMessage: '',
    leagueType: 'mens',
    coachName: '',
    currentScreen: 'TeamManager',
    gameConfig: { clockSpeed: 1000 },
  }) as GameState;

const renderWith = (state: GameState) =>
  render(
    <I18nextProvider i18n={i18n}>
      <GameEngineProvider initialState={state}>
        <TeamManager />
      </GameEngineProvider>
    </I18nextProvider>
  );

/** The human's club plays the second group of a live group stage. */
const groupStageState = (
  standings: Standing[] = teams.map((team, index) => buildStanding(team, index + 1))
): GameState =>
  buildState({
    phases: [groupPhase, knockoutPhase],
    currentPhaseIndex: 0,
    standings,
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 20,
      rounds: [
        {
          id: 'round-1',
          number: 1,
          status: 'not-started',
          phaseIndex: 0,
          phaseName: '1ª Fase',
          matches: [
            buildMatch({ homeTeam: teams[1], awayTeam: teams[2], phaseIndex: 0, group: 0 }),
            buildMatch({ homeTeam: teams[0], awayTeam: teams[3], phaseIndex: 0, group: 1 }),
          ],
        } as Round,
      ],
    },
  });

/** A knockout phase about to be played, with the human's club in it. */
const knockoutState = (): GameState =>
  buildState({
    phases: [groupPhase, knockoutPhase],
    currentPhaseIndex: 1,
    // The standings survive the group stage, so the screen must not read a position off them.
    standings: teams.map((team, index) => buildStanding(team, index + 1)),
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 19,
      totalRounds: 20,
      rounds: [
        {
          id: 'round-19',
          number: 19,
          status: 'not-started',
          phaseIndex: 1,
          phaseName: 'Quartas de Final',
          matches: [
            buildMatch({
              homeTeam: teams[0],
              awayTeam: teams[2],
              phaseIndex: 1,
              tieId: 'p1-t0',
              leg: 1,
            }),
          ],
        } as Round,
      ],
    },
  });

/** A semifinal round whose playoff (Série D 2026) the human's club plays, not the semifinal. */
const playoffState = (): GameState =>
  buildState({
    phases: [
      groupPhase,
      {
        ...knockoutPhase,
        name: 'Semifinal',
        playoff: {
          name: 'Playoffs',
          from: 'previous-phase-losers',
          pairs: [[1, 2]],
          secondLegHost: 'higher-seed',
          tiebreakers: ['goal-difference', 'seed'],
        },
      },
    ],
    currentPhaseIndex: 1,
    standings: teams.map((team, index) => buildStanding(team, index + 1)),
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 19,
      totalRounds: 20,
      rounds: [
        {
          id: 'round-19',
          number: 19,
          status: 'not-started',
          phaseIndex: 1,
          phaseName: 'Semifinal',
          matches: [
            buildMatch({
              homeTeam: teams[1],
              awayTeam: teams[2],
              phaseIndex: 1,
              tieId: 'p1-t0',
              leg: 1,
            }),
            buildMatch({
              homeTeam: teams[3],
              awayTeam: teams[0],
              phaseIndex: 1,
              tieId: 'p1-playoff-t0',
              leg: 1,
              bracket: 'playoff',
            }),
          ],
        } as Round,
      ],
    },
  });

describe('TeamManager — phased championships', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    jest.clearAllMocks();
  });

  it('names the knockout phase instead of counting rounds, and drops the position', () => {
    renderWith(knockoutState());

    expect(screen.getByText('Quartas de Final')).toBeInTheDocument();
    expect(screen.queryByText(/ROUND 19 OF 20/)).not.toBeInTheDocument();
    expect(screen.getByText(/POSITION: -/)).toBeInTheDocument();
  });

  it('names the playoff, not the semifinal, when the human club plays the playoff', () => {
    renderWith(playoffState());

    expect(screen.getByText('PROMOTION PLAYOFF')).toBeInTheDocument();
    expect(screen.queryByText('Semifinal')).not.toBeInTheDocument();
  });

  it('drops the opponent position in a knockout too', () => {
    renderWith(knockoutState());

    expect(screen.getByText('NEXT MATCH: T3')).toBeInTheDocument();
  });

  it("names the human club's group after its position during a group stage", () => {
    renderWith(groupStageState());

    // The club plays the second group, and the round count still applies.
    expect(screen.getByText('Brasileirão Série D')).toBeInTheDocument();
    expect(screen.getByText(/POSITION: 1st \(GROUP 2\)/)).toBeInTheDocument();
    expect(screen.getByText(/ROUND 1 OF 20/)).toBeInTheDocument();
  });

  it('ranks the club and its opponent within their group, not across the division', () => {
    // Division-wide: T2 9pts, T3 6pts, T4 3pts, T1 0pts. Group 2 holds only T1 and T4.
    const points = [0, 9, 6, 3];
    const standings = teams
      .map((team, index) => ({ ...buildStanding(team, 0), points: points[index] }))
      .sort((a, b) => b.points - a.points)
      .map((standing, index) => ({ ...standing, position: index + 1 }));

    renderWith(groupStageState(standings));

    expect(screen.getByText(/POSITION: 2nd \(GROUP 2\)/)).toBeInTheDocument();
    expect(screen.getByText('NEXT MATCH: T4 - 1st')).toBeInTheDocument();
  });

  it('leaves an unphased championship reading the plain round count', () => {
    renderWith(
      buildState({
        type: 'double-round-robin',
        standings: teams.map((team, index) => buildStanding(team, index + 1)),
      })
    );

    expect(screen.getByText('Brasileirão Série D')).toBeInTheDocument();
    expect(screen.getByText(/ROUND 1 OF 20/)).toBeInTheDocument();
    expect(screen.getByText('POSITION: 1st')).toBeInTheDocument();
  });
});
