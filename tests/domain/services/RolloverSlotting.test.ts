import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import { buildTeam, number } from '../../support/phasedSeasonHarness';

/**
 * An unphased, finished division of clubs `first…first+7`. `ranking` lists list indexes best first,
 * so the clubs that go up and down are deliberately not at the ends of the team list.
 */
function division(
  internalName: string,
  first: number,
  ranking: number[],
  fields: Partial<Championship> = {}
): Championship {
  const teams = Array.from({ length: 8 }, (_, index) => buildTeam(first + index));

  return {
    id: internalName,
    name: internalName,
    internalName,
    numberOfTeams: 8,
    teams,
    standings: ranking.map((index, rank) => ({
      team: teams[index],
      position: rank + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 30 - rank,
    })),
    matchContainer: {
      timer: 0,
      currentSeason: 2025,
      currentRound: 14,
      totalRounds: 14,
      rounds: [],
    },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
    ...fields,
  } as Championship;
}

const promotes = (count: number, into: string) => ({
  isPromotable: true as const,
  numberOfPromotableTeams: count,
  promotionChampionshipInternalName: into,
});
const relegates = (count: number, into: string) => ({
  isRelegatable: true as const,
  numberOfRelegatableTeams: count,
  relegationChampionshipInternalName: into,
});

// Upper (101–108): 107 and 108 finish bottom. Middle (1–8): club 4 (index 3) and club 7 (index 6)
// go up; club 1 (index 0) and club 6 (index 5) go down. Lower (201–208): 203 and 206 go up.
const upperRanking = [0, 1, 2, 3, 4, 5, 6, 7];
const middleRanking = [3, 6, 1, 2, 4, 7, 5, 0];
const lowerRanking = [2, 5, 0, 1, 3, 4, 6, 7];

function rollOver(container: ChampionshipContainer): ChampionshipContainer {
  const result = ChampionshipService.runEndOfChampionshipActions(container);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

const clubs = (teams: Team[]) => teams.map(number);

function container(
  slotting: { middle?: boolean; lower?: boolean },
  middleRelegates = 2,
  lowerPromotes = 2
): ChampionshipContainer {
  const flag = (on?: boolean) => (on ? { rolloverSlotting: 'replace-in-place' as const } : {});
  return {
    promotionChampionship: division('upper', 101, upperRanking, relegates(2, 'middle')),
    playableChampionship: division('middle', 1, middleRanking, {
      ...promotes(2, 'upper'),
      ...relegates(middleRelegates, 'lower'),
      ...flag(slotting.middle),
    }),
    relegationChampionship: division('lower', 201, lowerRanking, {
      ...promotes(lowerPromotes, 'middle'),
      ...flag(slotting.lower),
    }),
  };
}

describe("rolloverSlotting: 'replace-in-place' — the playable division", () => {
  it('puts each newcomer at an index an outgoing club vacated, in order', () => {
    const next = rollOver(container({ middle: true })).playableChampionship;

    // Out, in list order: 1 (idx 0), 4 (idx 3), 6 (idx 5), 7 (idx 6).
    // In, in order: relegated from upper 107, 108, then promoted from lower 203, 206.
    expect(clubs(next.teams)).toEqual([107, 2, 3, 108, 5, 203, 206, 8]);
  });

  it('keeps every non-exchanged club at its index', () => {
    const before = container({ middle: true }).playableChampionship.teams;
    const after = rollOver(container({ middle: true })).playableChampionship.teams;

    for (const index of [1, 2, 4, 7]) expect(after[index].id).toBe(before[index].id);
  });

  it('appends to the end without the flag, exactly as before', () => {
    const next = rollOver(container({})).playableChampionship;
    expect(clubs(next.teams)).toEqual([2, 3, 5, 8, 107, 108, 203, 206]);
  });
});

describe("rolloverSlotting: 'replace-in-place' — the relegation neighbour", () => {
  it('slots the clubs relegated from the playable division into the vacated indexes', () => {
    const next = rollOver(container({ lower: true })).relegationChampionship!;

    // Out of lower: 203 (idx 2) and 206 (idx 5). In: the playable's bottom two, 6 then 1.
    expect(clubs(next.teams)).toEqual([201, 202, 6, 204, 205, 1, 207, 208]);
  });

  it('appends surplus newcomers when more arrive than leave', () => {
    // The playable relegates 3 (6, 8, 1), the lower division promotes only 2.
    const next = rollOver(container({ lower: true }, 3, 2)).relegationChampionship!;
    expect(clubs(next.teams)).toEqual([201, 202, 8, 204, 205, 6, 207, 208, 1]);
  });

  it('closes the gaps, keeping the remaining order, when fewer arrive than leave', () => {
    // The playable relegates 1 (club 1), the lower division promotes 2 (203, 206).
    const next = rollOver(container({ lower: true }, 1, 2)).relegationChampionship!;
    expect(clubs(next.teams)).toEqual([201, 202, 1, 204, 205, 207, 208]);
  });

  it('appends to the end without the flag, exactly as before', () => {
    const next = rollOver(container({})).relegationChampionship!;
    expect(clubs(next.teams)).toEqual([201, 202, 204, 205, 207, 208, 6, 1]);
  });
});
