import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../../src/domain/services/ChampionshipService';
import { Championship } from '../../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../../src/domain/models/ChampionshipPhase';
import Standing from '../../../../src/domain/models/Standing';
import { Team } from '../../../../src/domain/models/Team';
import {
  buildFinalClassification,
  isPhasedChampionshipOver,
} from '../../../../src/domain/features/phases/PhaseProgression';
import Round from '../../../../src/domain/models/Round';
import RoundStatus from '../../../../src/domain/enums/RoundStatus';

function buildTeam(index: number): Team {
  return {
    id: `team-${String(index).padStart(2, '0')}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${String(index).padStart(2, '0')}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function standing(team: Team, points: number): Standing {
  return {
    team,
    position: 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: points,
    goalsAgainst: 0,
    points,
  };
}

function round(number: number, phaseIndex: number, status: RoundStatus): Round {
  return { id: `round-${number}`, number, matches: [], status, phaseIndex };
}

const phases: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 1,
    teamsPerGroup: 4,
    legs: 1,
    advancingPerGroup: 4,
  },
  {
    kind: 'knockout',
    name: 'Semifinal',
    numberOfTies: 2,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
  },
  {
    kind: 'knockout',
    name: 'Final',
    numberOfTies: 1,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
  },
];

const teams = [1, 2, 3, 4].map(buildTeam);

function buildChampionship(overrides: Partial<Championship> = {}): Championship {
  return {
    id: 'test',
    name: 'Test',
    internalName: 'test',
    numberOfTeams: 4,
    teams,
    standings: teams.map((team, index) => standing(team, 10 - index)),
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 3,
      rounds: [round(1, 0, 'ended'), round(2, 0, 'ended'), round(3, 0, 'ended')],
    },
    type: 'single-round-robin',
    leagueType: 'womens',
    hasTeamControlledByHuman: false,
    phases,
    isPromotable: false,
    isRelegatable: false,
    ...overrides,
  } as Championship;
}

describe('isChampionshipOver — phased', () => {
  it('is false while only the first phase has been played', () => {
    expect(isPhasedChampionshipOver(buildChampionship())).toBe(false);
  });

  it('is false when the final has been generated but not played', () => {
    const championship = buildChampionship({
      currentPhaseIndex: 2,
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 6,
        totalRounds: 7,
        rounds: [
          round(1, 0, 'ended'),
          round(4, 1, 'ended'),
          round(5, 1, 'ended'),
          round(6, 2, 'ended'),
          round(7, 2, 'not-started'),
        ],
      },
    });

    expect(isPhasedChampionshipOver(championship)).toBe(false);
  });

  it('is true once every round of the last phase is played', () => {
    const championship = buildChampionship({
      currentPhaseIndex: 2,
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 8,
        totalRounds: 7,
        rounds: [round(1, 0, 'ended'), round(6, 2, 'ended'), round(7, 2, 'ended')],
      },
    });

    expect(isPhasedChampionshipOver(championship)).toBe(true);
  });
});

describe('isChampionshipOver — unphased', () => {
  it('keeps the currentRound >= totalRounds behaviour exactly', () => {
    const notOver = buildChampionship({ phases: undefined });
    const over = buildChampionship({
      phases: undefined,
      matchContainer: { ...buildChampionship().matchContainer, currentRound: 3, totalRounds: 3 },
    });

    // `runEndOfChampionshipActions` is the only public reader of `isChampionshipOver`.
    expect(
      ChampionshipService.runEndOfChampionshipActions({ playableChampionship: notOver }).getResult()
        .playableChampionship.matchContainer.currentSeason
    ).toBe(2026);
    expect(
      ChampionshipService.runEndOfChampionshipActions({ playableChampionship: over }).getResult()
        .playableChampionship.matchContainer.currentSeason
    ).toBe(2027);
  });

  it('does not roll a phased championship over until its final is decided', () => {
    // currentRound has already passed totalRounds, which would have ended an unphased season.
    const championship = buildChampionship({
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 4,
        totalRounds: 3,
        rounds: [round(1, 0, 'ended'), round(2, 0, 'ended'), round(3, 0, 'ended')],
      },
    });

    const result = ChampionshipService.runEndOfChampionshipActions({
      playableChampionship: championship,
    });

    expect(result.getResult().playableChampionship.matchContainer.currentSeason).toBe(2026);
  });
});

describe('final classification', () => {
  const [first, second, third, fourth] = teams;

  const decided = buildChampionship({
    currentPhaseIndex: 2,
    // Accumulated across every phase: the club that topped the league has the most points.
    accumulatedStandings: [
      standing(first, 40),
      standing(second, 35),
      standing(third, 30),
      standing(fourth, 25),
    ],
    // ...but the final was contested by, and won by, the clubs below them.
    survivingTeamIds: [fourth.id],
    phaseParticipants: [
      teams.map((team) => team.id),
      [second.id, third.id, fourth.id, first.id],
      [fourth.id, third.id],
    ],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 8,
      totalRounds: 7,
      rounds: [round(6, 2, 'ended'), round(7, 2, 'ended')],
    },
  });

  it('forces the champion and runner-up to 1st and 2nd', () => {
    const classification = ChampionshipService.getFinalClassification(decided).getResult();

    expect(classification.map((entry) => entry.team.id)).toEqual([
      fourth.id,
      third.id,
      first.id,
      second.id,
    ]);
    expect(classification.map((entry) => entry.position)).toEqual([1, 2, 3, 4]);
  });

  it('orders everyone else by points accumulated across all phases', () => {
    const classification = buildFinalClassification(decided);

    expect(classification.slice(2).map((entry) => entry.points)).toEqual([40, 35]);
  });

  it('ranks on accumulated points alone while the season is still running', () => {
    const running = buildChampionship({
      accumulatedStandings: [standing(third, 9), standing(first, 12), standing(second, 6)],
    });

    expect(buildFinalClassification(running).map((entry) => entry.team.id)).toEqual([
      first.id,
      third.id,
      second.id,
    ]);
  });

  it('returns the live table unchanged for an unphased championship', () => {
    const unphased = buildChampionship({ phases: undefined });

    expect(buildFinalClassification(unphased)).toBe(unphased.standings);
  });
});
