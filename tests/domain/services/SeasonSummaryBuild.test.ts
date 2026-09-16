import { describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { Team } from '../../../src/domain/models/Team';

/**
 * `buildSeasonSummary` reports the same exchange the roll-over performs, for every division the
 * container holds — not just the playable one.
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
  isPromotable?: boolean;
  numberOfPromotableTeams?: number;
  isRelegatable?: boolean;
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
    isPromotable: params.isPromotable ?? false,
    numberOfPromotableTeams: params.numberOfPromotableTeams ?? 0,
    promotionChampionshipInternalName: 'upper',
    isRelegatable: params.isRelegatable ?? false,
    numberOfRelegatableTeams: params.numberOfRelegatableTeams ?? 0,
    relegationChampionshipInternalName: 'lower',
  } as Championship;
}

function buildContainer(): ChampionshipContainer {
  const upper = ['UP1', 'UP2', 'UP3', 'UP4', 'UP5', 'UP6'].map(buildTeam);
  const playable = ['PL1', 'PL2', 'PL3', 'PL4', 'PL5', 'PL6'].map(buildTeam);
  const lower = ['LW1', 'LW2', 'LW3', 'LW4', 'LW5', 'LW6'].map(buildTeam);

  return {
    promotionChampionship: buildDivision({
      name: 'Upper Division',
      internalName: 'upper',
      teams: upper,
      isPromotable: true,
      numberOfPromotableTeams: 2,
      isRelegatable: true,
      numberOfRelegatableTeams: 2,
    }),
    playableChampionship: buildDivision({
      name: 'Playable Division',
      internalName: 'playable',
      teams: playable,
      isPromotable: true,
      numberOfPromotableTeams: 2,
      isRelegatable: true,
      numberOfRelegatableTeams: 2,
    }),
    relegationChampionship: buildDivision({
      name: 'Lower Division',
      internalName: 'lower',
      teams: lower,
      isPromotable: true,
      numberOfPromotableTeams: 2,
      isRelegatable: true,
      numberOfRelegatableTeams: 2,
    }),
  };
}

const abbreviationsOf = (teams?: { abbreviation: string }[]) =>
  teams?.map((team) => team.abbreviation);

describe('ChampionshipService.buildSeasonSummary', () => {
  it('reports every division in the container, top of the pyramid first', () => {
    const summary = ChampionshipService.buildSeasonSummary(buildContainer()).getResult();

    expect(summary.season).toBe(2031);
    expect(summary.divisions.map((division) => division.divisionName)).toEqual([
      'Upper Division',
      'Playable Division',
      'Lower Division',
    ]);
  });

  it('names the top two of each division off its final classification', () => {
    const summary = ChampionshipService.buildSeasonSummary(buildContainer()).getResult();

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
    container.playableChampionship = {
      ...container.playableChampionship,
      numberOfPromotableTeams: 3,
    } as Championship;

    const summary = ChampionshipService.buildSeasonSummary(container).getResult();
    const playable = summary.divisions[1];

    // PL1 and PL2 go up as champion and runner-up; only PL3 is left for "also promoted".
    expect(abbreviationsOf(playable.otherPromotedTeams)).toEqual(['PL3']);
  });

  it('reports the playable division relegating off the bottom of its table', () => {
    const summary = ChampionshipService.buildSeasonSummary(buildContainer()).getResult();

    expect(abbreviationsOf(summary.divisions[1].relegatedTeams)).toEqual(['PL5', 'PL6']);
  });

  it('matches the exchange the roll-over then performs', () => {
    const container = buildContainer();
    const summary = ChampionshipService.buildSeasonSummary(container).getResult();
    const rolled = ChampionshipService.runEndOfChampionshipActions(container).getResult();

    const nextPlayable = rolled.playableChampionship.teams.map((team) => team.abbreviation);

    // Whoever the summary says went down out of the upper division, and up out of the lower one, is
    // exactly who the roll-over put into the playable division.
    abbreviationsOf(summary.divisions[0].relegatedTeams)?.forEach((abbreviation) =>
      expect(nextPlayable).toContain(abbreviation)
    );
    abbreviationsOf(summary.divisions[2].otherPromotedTeams ?? [])?.forEach((abbreviation) =>
      expect(nextPlayable).toContain(abbreviation)
    );
    expect(nextPlayable).toContain(summary.divisions[2].champion?.abbreviation);

    // And whoever it says left the playable division is gone from it.
    abbreviationsOf(summary.divisions[1].relegatedTeams)?.forEach((abbreviation) =>
      expect(nextPlayable).not.toContain(abbreviation)
    );
    expect(nextPlayable).not.toContain(summary.divisions[1].champion?.abbreviation);
  });

  it('leaves a neighbour division’s untracked exchange undefined rather than empty', () => {
    const summary = ChampionshipService.buildSeasonSummary(buildContainer()).getResult();
    const [upper, playable, lower] = summary.divisions;

    // The container never works out where the upper division promotes to, nor where the lower one
    // relegates to — those divisions are outside it.
    expect(upper.otherPromotedTeams).toBeUndefined();
    expect(upper.relegatedTeams).toBeDefined();
    expect(lower.relegatedTeams).toBeUndefined();
    expect(lower.otherPromotedTeams).toBeDefined();

    // The playable division has both halves.
    expect(playable.otherPromotedTeams).toBeDefined();
    expect(playable.relegatedTeams).toBeDefined();
  });

  it('reports a division with no neighbour on a side as empty rather than untracked', () => {
    const container = buildContainer();
    // A top-of-the-pyramid upper division and a bottom-of-the-pyramid lower one.
    container.promotionChampionship = {
      ...container.promotionChampionship,
      isPromotable: false,
    } as Championship;
    container.relegationChampionship = {
      ...container.relegationChampionship,
      isRelegatable: false,
    } as Championship;

    const summary = ChampionshipService.buildSeasonSummary(container).getResult();

    expect(summary.divisions[0]).toMatchObject({ isPromotable: false, otherPromotedTeams: [] });
    expect(summary.divisions[2]).toMatchObject({ isRelegatable: false, relegatedTeams: [] });
  });

  it('reports only the playable division when the container holds nothing else', () => {
    const container = buildContainer();
    const summary = ChampionshipService.buildSeasonSummary({
      playableChampionship: buildDivision({
        name: 'Only Division',
        internalName: 'playable',
        teams: container.playableChampionship.teams,
      }),
    }).getResult();

    expect(summary.divisions).toHaveLength(1);
    expect(summary.divisions[0].otherPromotedTeams).toEqual([]);
    expect(summary.divisions[0].relegatedTeams).toEqual([]);
  });
});
