import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';
import { SeasonSummary } from '../../../src/domain/models/SeasonSummary';
import {
  getChampionshipByInternalName,
  replaceChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

/**
 * `buildSeasonSummary` reports the same exchange the roll-over performs, for every division of the
 * pyramid — not just the playable one (MS-109).
 */

let nextTeam = 0;

function buildTeam(abbreviation: string): Team {
  nextTeam += 1;
  const block = String(nextTeam).padStart(4, '0');

  return {
    id: `0000${block}-${block}-${block}-${block}-0000${block}0000` as Team['id'],
    fullName: `${abbreviation} Full`,
    shortName: `${abbreviation} Short`,
    abbreviation,
    colors: { outline: '#111111', background: '#222222', text: '#eeeeee' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

/** Six clubs, ranked in the order given: the first is champion, the last is bottom. */
function buildDivision(params: {
  name: string;
  internalName: string;
  teams: Team[];
  promotesInto?: string;
  numberOfPromotableTeams?: number;
  relegatesInto?: string;
  numberOfRelegatableTeams?: number;
}): Championship {
  return {
    id: params.internalName,
    name: params.name,
    internalName: params.internalName,
    numberOfTeams: params.teams.length,
    teams: params.teams,
    standings: params.teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: params.teams.length - index - 1,
      draws: 0,
      losses: index,
      goalsFor: 20 - index,
      goalsAgainst: index,
      points: (params.teams.length - index - 1) * 3,
    })),
    matchContainer: {
      timer: 90,
      currentSeason: 2031,
      currentRound: 10,
      totalRounds: 10,
      rounds: [],
    },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    ...(params.promotesInto
      ? {
          isPromotable: true,
          numberOfPromotableTeams: params.numberOfPromotableTeams ?? 2,
          promotionChampionshipInternalName: params.promotesInto,
        }
      : { isPromotable: false }),
    ...(params.relegatesInto
      ? {
          isRelegatable: true,
          numberOfRelegatableTeams: params.numberOfRelegatableTeams ?? 2,
          relegationChampionshipInternalName: params.relegatesInto,
        }
      : { isRelegatable: false }),
  } as Championship;
}

/** A three-tier pyramid — upper, playable, lower — each exchanging two clubs with its neighbour. */
function buildContainer(): ChampionshipContainer {
  const upper = ['UP1', 'UP2', 'UP3', 'UP4', 'UP5', 'UP6'].map(buildTeam);
  const playable = ['PL1', 'PL2', 'PL3', 'PL4', 'PL5', 'PL6'].map(buildTeam);
  const lower = ['LW1', 'LW2', 'LW3', 'LW4', 'LW5', 'LW6'].map(buildTeam);

  return {
    championships: [
      buildDivision({
        name: 'Upper Division',
        internalName: 'upper',
        teams: upper,
        relegatesInto: 'playable',
      }),
      buildDivision({
        name: 'Playable Division',
        internalName: 'playable',
        teams: playable,
        promotesInto: 'upper',
        relegatesInto: 'lower',
      }),
      buildDivision({
        name: 'Lower Division',
        internalName: 'lower',
        teams: lower,
        promotesInto: 'playable',
      }),
    ],
    playableInternalName: 'playable',
  };
}

const abbreviationsOf = (teams: { abbreviation: string }[]) =>
  teams.map((team) => team.abbreviation);

const summaryOf = (container: ChampionshipContainer): SeasonSummary =>
  ChampionshipService.buildSeasonSummary(container).getResult();

const teamsOf = (container: ChampionshipContainer, internalName: string) =>
  getChampionshipByInternalName(container, internalName)!.teams.map((team) => team.abbreviation);

describe('ChampionshipService.buildSeasonSummary', () => {
  it('reports every division of the pyramid, top tier first', () => {
    const summary = summaryOf(buildContainer());

    expect(summary.season).toBe(2031);
    expect(summary.divisions.map((division) => division.divisionName)).toEqual([
      'Upper Division',
      'Playable Division',
      'Lower Division',
    ]);
  });

  it('names the top two of each division off its final classification', () => {
    const summary = summaryOf(buildContainer());

    expect(summary.divisions.map((division) => division.champion?.abbreviation)).toEqual([
      'UP1',
      'PL1',
      'LW1',
    ]);
    expect(summary.divisions.map((division) => division.runnerUp?.abbreviation)).toEqual([
      'UP2',
      'PL2',
      'LW2',
    ]);
  });

  it('drops the top two from the promotion list, since they are named above it', () => {
    const container = buildContainer();
    const playable = getChampionshipByInternalName(container, 'playable')!;
    const summary = summaryOf(
      replaceChampionship(container, { ...playable, numberOfPromotableTeams: 3 } as Championship)
    );

    // PL1 and PL2 go up as champion and runner-up; only PL3 is left for "also promoted".
    expect(abbreviationsOf(summary.divisions[1].otherPromotedTeams)).toEqual(['PL3']);
  });

  it('reports each division relegating off the bottom of its own table', () => {
    const summary = summaryOf(buildContainer());

    expect(abbreviationsOf(summary.divisions[0].relegatedTeams)).toEqual(['UP5', 'UP6']);
    expect(abbreviationsOf(summary.divisions[1].relegatedTeams)).toEqual(['PL5', 'PL6']);
  });

  it('matches the exchange the roll-over then performs, at every boundary', () => {
    const container = buildContainer();
    const [upper, playable, lower] = summaryOf(container).divisions;
    const rolled = ChampionshipService.runEndOfChampionshipActions(container).getResult();

    // Upper: loses its relegated clubs, gains the playable division's champion and runner-up.
    expect(teamsOf(rolled, 'upper').sort()).toEqual(
      [
        'UP1',
        'UP2',
        'UP3',
        'UP4',
        playable.champion!.abbreviation,
        playable.runnerUp!.abbreviation,
      ].sort()
    );
    // Playable: both of its boundaries at once.
    expect(teamsOf(rolled, 'playable').sort()).toEqual(
      [
        'PL3',
        'PL4',
        ...abbreviationsOf(upper.relegatedTeams),
        lower.champion!.abbreviation,
        lower.runnerUp!.abbreviation,
      ].sort()
    );
    // Lower: loses its top two, gains the playable division's relegated clubs.
    expect(teamsOf(rolled, 'lower').sort()).toEqual(
      ['LW3', 'LW4', 'LW5', 'LW6', ...abbreviationsOf(playable.relegatedTeams)].sort()
    );
  });

  it('always defines both exchange lists, empty only where nobody moved', () => {
    const [upper, playable, lower] = summaryOf(buildContainer()).divisions;

    // The top of the pyramid promotes nobody and the bottom relegates nobody.
    expect(upper).toMatchObject({ isPromotable: false, otherPromotedTeams: [] });
    expect(lower).toMatchObject({ isRelegatable: false, relegatedTeams: [] });
    // Two promoted clubs are the champion and runner-up, so nobody else went up.
    expect(playable.otherPromotedTeams).toEqual([]);
    expect(lower.otherPromotedTeams).toEqual([]);
  });

  it('flags the division the human played in', () => {
    const container = buildContainer();

    expect(summaryOf(container).divisions.map((division) => division.isHumanDivision)).toEqual([
      false,
      true,
      false,
    ]);
    expect(
      summaryOf({ ...container, playableInternalName: 'lower' }).divisions.map(
        (division) => division.isHumanDivision
      )
    ).toEqual([false, false, true]);
  });

  it('reports only the playable division when the pyramid holds nothing else', () => {
    const container = buildContainer();
    const only = buildDivision({
      name: 'Only Division',
      internalName: 'playable',
      teams: getChampionshipByInternalName(container, 'playable')!.teams,
    });
    const summary = summaryOf({ championships: [only], playableInternalName: 'playable' });

    expect(summary.divisions).toHaveLength(1);
    expect(summary.divisions[0].otherPromotedTeams).toEqual([]);
    expect(summary.divisions[0].relegatedTeams).toEqual([]);
  });
});

describe.each([
  [
    "men's",
    'brasileirao-serie-d',
    ['BRASILEIRÃO SÉRIE A', 'BRASILEIRÃO SÉRIE B', 'BRASILEIRÃO SÉRIE C', 'BRASILEIRÃO SÉRIE D'],
  ],
  ["women's", 'brasileirao-feminino-serie-a3', 3],
])('a played %s season over the seeded pyramid', (_, entry, expected) => {
  let container: ChampionshipContainer;
  let summary: SeasonSummary;

  beforeAll(() => {
    useUniqueTeamIds();
    const season = new ScriptedSeason(entry).playToEnd();
    container = season.container;
    summary = summaryOf(container);
  });

  it('has one page per tier, top first, with the human’s division last', () => {
    const names = container.championships.map((championship) => championship.name);
    expect(summary.divisions.map((division) => division.divisionName)).toEqual(names);
    if (Array.isArray(expected)) expect(names).toEqual(expected);
    else expect(names).toHaveLength(expected);

    expect(summary.divisions.map((division) => division.isHumanDivision)).toEqual(
      names.map((__, index) => index === names.length - 1)
    );
  });

  it('knows every division’s promoted and relegated clubs', () => {
    summary.divisions.forEach((division, index) => {
      expect(Array.isArray(division.otherPromotedTeams)).toBe(true);
      expect(Array.isArray(division.relegatedTeams)).toBe(true);
      // Every division but the bottom relegates somebody.
      if (index < summary.divisions.length - 1) {
        expect(division.relegatedTeams.length).toBeGreaterThan(0);
      }
    });
  });
});
