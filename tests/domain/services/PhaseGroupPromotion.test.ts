import { describe, expect, it } from '@jest/globals';
import ChampionshipService, {
  getMinimumField,
} from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import ChampionshipPhase from '../../../src/domain/models/ChampionshipPhase';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';
import {
  buildChampionship,
  buildTeam,
  lowerNumberWins,
  number,
  playUntil,
  Script,
} from '../../support/phasedSeasonHarness';

/** Série C 2025's shape (REC C Arts. 12–22). */
const serieCShape: ChampionshipPhase[] = [
  {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 1,
    teamsPerGroup: 20,
    legs: 1,
    advancingPerGroup: 8,
  },
  {
    kind: 'round-robin',
    name: '2ª Fase',
    numberOfGroups: 2,
    teamsPerGroup: 4,
    legs: 2,
    advancingPerGroup: 1,
    groupAllocation: 'serpentine',
  },
  {
    kind: 'knockout',
    name: 'Final',
    numberOfTies: 1,
    legs: 2,
    secondLegHost: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
    crossings: {
      from: 'group-position',
      pairs: [
        [
          { group: 0, position: 1 },
          { group: 1, position: 1 },
        ],
      ],
    },
  },
];

function serieC(teamCount: number, relegates = 0): Championship {
  return {
    ...buildChampionship(teamCount, serieCShape),
    isPromotable: true,
    numberOfPromotableTeams: 4,
    promotionChampionshipInternalName: 'upper',
    promotionRule: 'phase-group-position',
    promotionPhaseIndex: 1,
    ...(relegates
      ? {
          isRelegatable: true,
          numberOfRelegatableTeams: relegates,
          relegationChampionshipInternalName: 'lower',
          relegationRule: 'first-phase-table-position',
        }
      : { isRelegatable: false }),
  } as Championship;
}

/** An unphased upper division whose bottom four (clubs 105–108) go down. */
function upperDivision(): Championship {
  const teams = Array.from({ length: 8 }, (_, index) => buildTeam(101 + index));
  return {
    id: 'upper',
    name: 'Upper',
    internalName: 'upper',
    numberOfTeams: 8,
    teams,
    standings: teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 30 - index,
    })),
    matchContainer: {
      timer: 0,
      currentSeason: 2025,
      currentRound: 15,
      totalRounds: 14,
      rounds: [],
    },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: true,
    numberOfRelegatableTeams: 4,
    relegationChampionshipInternalName: 'fixture',
  } as Championship;
}

/**
 * The 1ª Fase follows club number, so club 1 wins it — Caxias in 2025. In the 2ª Fase club 1 loses
 * every match and finishes last in its group, as Caxias did in Grupo B.
 */
const caxiasCollapses =
  (finalWinner: number): Script =>
  (match, phaseIndex) => {
    const home = number(match.homeTeam);
    const away = number(match.awayTeam);
    if (phaseIndex === 2) return home === finalWinner ? [2, 0] : [0, 2];
    if (phaseIndex === 1 && (home === 1 || away === 1)) return home === 1 ? [0, 2] : [2, 0];
    return lowerNumberWins(match, phaseIndex);
  };

function rollOver(playable: Championship): ChampionshipContainer {
  const container: ChampionshipContainer = {
    playableChampionship: playable,
    promotionChampionship: upperDivision(),
  };
  const result = ChampionshipService.runEndOfChampionshipActions(container);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

const promotedInto = (container: ChampionshipContainer) =>
  container
    .promotionChampionship!.teams.map(number)
    .filter((club) => club < 100)
    .sort((a, b) => a - b);

describe("promotionRule: 'phase-group-position' (REC C Art. 5º)", () => {
  // 2ª Fase groups, serpentine from the 1ª Fase: [1, 4, 5, 8] and [2, 3, 6, 7].
  const groupFourWinsFinal = playUntil(serieC(20), caxiasCollapses(4));
  const groupTwoWinsFinal = playUntil(serieC(20), caxiasCollapses(2));

  it('promotes the top 2 of each 2ª Fase group', () => {
    expect(promotedInto(rollOver(groupFourWinsFinal))).toEqual([2, 3, 4, 5]);
  });

  it('keeps down the club that won the 1ª Fase and finished last in its 2ª Fase group', () => {
    // São Bernardo went up in 2025; Caxias, 1º of the 1ª Fase and 4º of Grupo B, did not.
    expect(groupFourWinsFinal.phaseStandings?.[0]?.[0].team.id).toBe('team-001');
    const next = rollOver(groupFourWinsFinal);

    expect(promotedInto(next)).not.toContain(1);
    expect(next.playableChampionship.teams.map(number)).toContain(1);
  });

  it('is not changed by the final — the final only awards the title', () => {
    expect(groupFourWinsFinal.survivingTeamIds).toEqual(['team-004']);
    expect(groupTwoWinsFinal.survivingTeamIds).toEqual(['team-002']);
    expect(promotedInto(rollOver(groupTwoWinsFinal))).toEqual(
      promotedInto(rollOver(groupFourWinsFinal))
    );
  });

  it('replaces the promoted clubs with the relegated ones, keeping the division at 20', () => {
    const next = rollOver(groupFourWinsFinal);

    expect(next.playableChampionship.teams).toHaveLength(20);
    expect(
      next.playableChampionship.teams
        .map(number)
        .filter((club) => club > 100)
        .sort()
    ).toEqual([105, 106, 107, 108]);
  });

  it('trims group winners last when the promotion is capped by the field floor', () => {
    // 10 clubs relegating 4 need 8 + 4 = 12 after the exchange: only 10 + 4 − 12 = 2 can go up.
    const small = playUntil(serieC(10, 4), caxiasCollapses(4));
    expect(promotedInto(rollOver(small))).toEqual([2, 4]);
  });
});

describe('getMinimumField', () => {
  const phasesOf = (internalName: string) =>
    (championshipsJSON as { internalName: string; phases?: ChampionshipPhase[] }[]).find(
      (entry) => entry.internalName === internalName
    )!.phases;

  it('holds the 1ª Fase qualifiers plus the relegated clubs for a round-robin second phase', () => {
    expect(getMinimumField(serieCShape, 4)).toBe(12);
    expect(getMinimumField(serieCShape)).toBe(8);
  });

  it('is unchanged for a knockout second phase, whatever the relegation count', () => {
    expect(getMinimumField(phasesOf('brasileirao-feminino-serie-a1'), 2)).toBe(8);
    expect(getMinimumField(phasesOf('brasileirao-feminino-serie-a3'), 0)).toBe(16);
    expect(getMinimumField(undefined, 4)).toBe(2);
  });
});
