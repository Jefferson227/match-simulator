import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../src/domain/models/ChampionshipPhase';
import Round from '../../../src/domain/models/Round';
import RoundStatus from '../../../src/domain/enums/RoundStatus';
import Standing from '../../../src/domain/models/Standing';
import { Team } from '../../../src/domain/models/Team';

function buildTeam(prefix: string, index: number): Team {
  return {
    id: `${prefix}-${String(index).padStart(2, '0')}` as Team['id'],
    fullName: `${prefix} ${index}`,
    shortName: `${prefix}${index}`,
    abbreviation: `${prefix}${String(index).padStart(2, '0')}`,
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

function round(number: number, phaseIndex: number, status: RoundStatus = 'ended'): Round {
  return { id: `r${number}`, number, matches: [], status, phaseIndex };
}

const phases: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 1,
    teamsPerGroup: 8,
    legs: 1,
    advancingPerGroup: 8,
  },
  {
    kind: 'knockout',
    name: 'Quartas de Final',
    numberOfTies: 4,
    legs: 2,
    secondLegHost: 'higher-seed',
    tiebreakers: ['goal-difference', 'penalties'],
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

const lower = Array.from({ length: 8 }, (_, index) => buildTeam('LOW', index + 1));
const upper = Array.from({ length: 8 }, (_, index) => buildTeam('UPP', index + 1));

/**
 * A phased second tier whose four semifinalists are deliberately **not** the top four of any table:
 * they are the clubs ranked 5th–8th on accumulated points.
 */
function buildLowerDivision(overrides: Partial<Championship> = {}): Championship {
  const semifinalists = [lower[4], lower[5], lower[6], lower[7]];

  return {
    id: 'lower',
    name: 'Lower',
    internalName: 'lower',
    numberOfTeams: 8,
    teams: lower,
    standings: lower.map((team, index) => standing(team, 20 - index)),
    // The 1ª Fase table has the opposite order of the accumulated table, so a test that reads the
    // wrong one is impossible to pass by accident.
    firstPhaseStandings: [...lower].reverse().map((team, index) => standing(team, 30 - index)),
    accumulatedStandings: lower.map((team, index) => standing(team, 50 - index)),
    phaseParticipants: [
      lower.map((team) => team.id),
      lower.map((team) => team.id),
      semifinalists.map((team) => team.id),
      [lower[7].id, lower[6].id],
    ],
    survivingTeamIds: [lower[7].id],
    currentPhaseIndex: 3,
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 24,
      totalRounds: 23,
      rounds: [round(1, 0), round(22, 3), round(23, 3)],
    },
    type: 'single-round-robin',
    leagueType: 'womens',
    hasTeamControlledByHuman: true,
    phases,
    isPromotable: true,
    numberOfPromotableTeams: 4,
    promotionChampionshipInternalName: 'upper',
    promotionRule: 'semifinalists',
    isRelegatable: false,
    ...overrides,
  } as Championship;
}

/** A phased top tier that relegates off its 1ª Fase table. */
function buildUpperDivision(overrides: Partial<Championship> = {}): Championship {
  return {
    id: 'upper',
    name: 'Upper',
    internalName: 'upper',
    numberOfTeams: 8,
    teams: upper,
    standings: upper.map((team, index) => standing(team, 20 - index)),
    // Reversed against the final table: the 1ª Fase's worst two are UPP01 and UPP02.
    firstPhaseStandings: [...upper].reverse().map((team, index) => standing(team, 30 - index)),
    accumulatedStandings: upper.map((team, index) => standing(team, 50 - index)),
    phaseParticipants: [upper.map((team) => team.id)],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 24,
      totalRounds: 23,
      rounds: [round(1, 0), round(22, 3), round(23, 3)],
    },
    type: 'single-round-robin',
    leagueType: 'womens',
    hasTeamControlledByHuman: false,
    phases,
    isPromotable: false,
    isRelegatable: true,
    numberOfRelegatableTeams: 4,
    relegationChampionshipInternalName: 'lower',
    relegationRule: 'first-phase-table-position',
    ...overrides,
  } as Championship;
}

function rollOver(container: ChampionshipContainer): ChampionshipContainer {
  const result = ChampionshipService.runEndOfChampionshipActions(container);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

describe("promotionRule: 'semifinalists'", () => {
  it('promotes the four semifinalists even though they are the bottom four on every table', () => {
    const rolled = rollOver({
      playableChampionship: buildLowerDivision(),
      promotionChampionship: buildUpperDivision(),
    });

    const promoted = rolled
      .promotionChampionship!.teams.filter((team) => team.id.startsWith('LOW'))
      .map((team) => team.id);

    expect(promoted.sort()).toEqual(['LOW-05', 'LOW-06', 'LOW-07', 'LOW-08']);
    // Not the top of the accumulated table, which is LOW-01..04.
    expect(promoted).not.toContain('LOW-01');
  });

  it('leaves the promoted clubs out of the lower division the next season', () => {
    const rolled = rollOver({
      playableChampionship: buildLowerDivision(),
      promotionChampionship: buildUpperDivision(),
    });

    const remaining = rolled.playableChampionship.teams.map((team) => team.id);
    expect(remaining).not.toContain('LOW-05');
    expect(remaining).toContain('LOW-01');
  });

  it('falls back to the table when no semifinal has been recorded', () => {
    const withoutRecord = buildLowerDivision({ phaseParticipants: [] });
    const rolled = rollOver({
      playableChampionship: withoutRecord,
      promotionChampionship: buildUpperDivision(),
    });

    const promoted = rolled
      .promotionChampionship!.teams.filter((team) => team.id.startsWith('LOW'))
      .map((team) => team.id);

    // The final classification still forces the champion to 1st (REC A1 Art. 27), so the fallback
    // is LOW-08 plus the top of the accumulated table.
    expect(promoted.sort()).toEqual(['LOW-01', 'LOW-02', 'LOW-03', 'LOW-08']);
  });
});

describe("relegationRule: 'first-phase-table-position'", () => {
  it('relegates the bottom of the 1ª Fase table, not of the final classification', () => {
    const rolled = rollOver({
      playableChampionship: buildLowerDivision(),
      promotionChampionship: buildUpperDivision(),
    });

    const relegated = rolled.playableChampionship.teams
      .filter((team) => team.id.startsWith('UPP'))
      .map((team) => team.id);

    // firstPhaseStandings is reversed, so its bottom four are UPP04..UPP01.
    expect(relegated.sort()).toEqual(['UPP-01', 'UPP-02', 'UPP-03', 'UPP-04']);
    // The final classification's bottom four would have been UPP05..UPP08.
    expect(relegated).not.toContain('UPP-08');
  });

  it('falls back to the final classification when no 1ª Fase table was kept', () => {
    const rolled = rollOver({
      playableChampionship: buildLowerDivision(),
      promotionChampionship: buildUpperDivision({ firstPhaseStandings: undefined }),
    });

    const relegated = rolled.playableChampionship.teams
      .filter((team) => team.id.startsWith('UPP'))
      .map((team) => team.id);

    expect(relegated.sort()).toEqual(['UPP-05', 'UPP-06', 'UPP-07', 'UPP-08']);
  });
});

describe("'table-position' — the default", () => {
  it('is used when a championship declares no rule, and reads the final classification', () => {
    const rolled = rollOver({
      playableChampionship: buildLowerDivision({ promotionRule: undefined }),
      promotionChampionship: buildUpperDivision({ relegationRule: undefined }),
    });

    const promoted = rolled
      .promotionChampionship!.teams.filter((team) => team.id.startsWith('LOW'))
      .map((team) => team.id)
      .sort();
    const relegated = rolled.playableChampionship.teams
      .filter((team) => team.id.startsWith('UPP'))
      .map((team) => team.id)
      .sort();

    // For a phased championship the table is the final classification, which puts the champion
    // (LOW-08) and runner-up (LOW-07) first whatever their accumulated points.
    expect(promoted).toEqual(['LOW-01', 'LOW-02', 'LOW-07', 'LOW-08']);
    expect(relegated).toEqual(['UPP-05', 'UPP-06', 'UPP-07', 'UPP-08']);
  });

  it('is unchanged for an unphased championship — it slices the live standings', () => {
    const unphasedLower = buildLowerDivision({
      phases: undefined,
      promotionRule: undefined,
      accumulatedStandings: undefined,
      firstPhaseStandings: undefined,
      phaseParticipants: undefined,
      survivingTeamIds: undefined,
      currentPhaseIndex: undefined,
    });
    const unphasedUpper = buildUpperDivision({
      phases: undefined,
      relegationRule: undefined,
      accumulatedStandings: undefined,
      firstPhaseStandings: undefined,
      phaseParticipants: undefined,
    });

    const rolled = rollOver({
      playableChampionship: unphasedLower,
      promotionChampionship: unphasedUpper,
    });

    expect(
      rolled
        .promotionChampionship!.teams.filter((team) => team.id.startsWith('LOW'))
        .map((team) => team.id)
        .sort()
    ).toEqual(['LOW-01', 'LOW-02', 'LOW-03', 'LOW-04']);
    expect(
      rolled.playableChampionship.teams
        .filter((team) => team.id.startsWith('UPP'))
        .map((team) => team.id)
        .sort()
    ).toEqual(['UPP-05', 'UPP-06', 'UPP-07', 'UPP-08']);
  });
});
