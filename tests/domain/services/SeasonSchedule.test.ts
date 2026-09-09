import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { RoundRobinPhase } from '../../../src/domain/models/ChampionshipPhase';
import { counts, divisions, init, rollOver, useUniqueTeamIds } from '../../support/seasonHarness';

beforeAll(useUniqueTeamIds);

const A1 = 'brasileirao-feminino-serie-a1';
const A2 = 'brasileirao-feminino-serie-a2';
const A3 = 'brasileirao-feminino-serie-a3';

/**
 * MS-104's schedule, verbatim from `wiki/decisions/ms-104-a3-group-shape-schedule.md`.
 *
 * Nothing forces a club count directly — every number is a consequence of the exchange rules, so a
 * row that fails means a rule moved, not that a constant needs updating.
 *
 * | Season | A1 clubs | A1 relegates | A2 clubs | A2 promotes / relegates | A3 clubs | A3 promotes |
 * |---|---|---|---|---|---|---|
 * | 2026 | 18 | 2 | 16 | 4 / 2 | 32 | 4 |
 * | 2027 | 20 | 4 | 16 | 4 / 2 | 30 | 4 |
 * | 2028 | 20 | 4 | 18 | 4 / 2 | 28 | 4 |
 * | 2029 | 20 | 4 | 20 | 4 / 4 | 26 | 4 |
 * | 2030 | 20 | 4 | 20 | 4 / 4 | 26 | 4 |
 *
 * `createMatches` stamps the first season with `new Date().getFullYear()`, so the years below are
 * the schedule as it plays for a game started in 2026. Selection is by club count and never by the
 * year (MS-104 requirement 4), so the assertions compare offsets from whatever the first season is.
 */
const SCHEDULE = [
  {
    season: 2026,
    a1: 18,
    a1Relegates: 2,
    a2: 16,
    a2Promotes: 4,
    a2Relegates: 2,
    a3: 32,
    a3Promotes: 4,
    a3Groups: 8,
  },
  {
    season: 2027,
    a1: 20,
    a1Relegates: 4,
    a2: 16,
    a2Promotes: 4,
    a2Relegates: 2,
    a3: 30,
    a3Promotes: 4,
    a3Groups: 4,
  },
  {
    season: 2028,
    a1: 20,
    a1Relegates: 4,
    a2: 18,
    a2Promotes: 4,
    a2Relegates: 2,
    a3: 28,
    a3Promotes: 4,
    a3Groups: 4,
  },
  {
    season: 2029,
    a1: 20,
    a1Relegates: 4,
    a2: 20,
    a2Promotes: 4,
    a2Relegates: 4,
    a3: 26,
    a3Promotes: 4,
    a3Groups: 4,
  },
  {
    season: 2030,
    a1: 20,
    a1Relegates: 4,
    a2: 20,
    a2Promotes: 4,
    a2Relegates: 4,
    a3: 26,
    a3Promotes: 4,
    a3Groups: 4,
  },
] as const;

const FIRST_SEASON = SCHEDULE[0].season;

function byInternalName(container: ChampionshipContainer): Record<string, Championship> {
  return Object.fromEntries(
    divisions(container).map((championship) => [championship.internalName, championship])
  );
}

/** How many clubs left `from` for `to` across the roll-over — the exchange as it actually ran. */
function moved(
  before: ChampionshipContainer,
  after: ChampionshipContainer,
  from: string,
  to: string
): number {
  const left = new Set(byInternalName(before)[from].teams.map((team) => team.id));
  return byInternalName(after)[to].teams.filter((team) => left.has(team.id)).length;
}

function groupCount(championship: Championship): number {
  const firstPhase = championship.phases?.[0] as RoundRobinPhase | undefined;
  return firstPhase?.numberOfGroups ?? 0;
}

/** A3 is only loaded alongside A1 and A2 when A2 is the division being played. */
function playA2(): ChampionshipContainer {
  return init(A2);
}

describe('MS-104 — the women’s pyramid across 2026–2030', () => {
  it('starts on the 2026 row', () => {
    const container = playA2();
    const [row] = SCHEDULE;

    expect(counts(container)).toEqual({ [A1]: row.a1, [A2]: row.a2, [A3]: row.a3 });
    expect(groupCount(byInternalName(container)[A3])).toBe(row.a3Groups);
  });

  it('reaches every club count in the table, one roll-over per season', () => {
    let container = playA2();

    for (const row of SCHEDULE.slice(1)) {
      container = rollOver(container);

      expect({ season: row.season, ...counts(container) }).toEqual({
        season: row.season,
        [A1]: row.a1,
        [A2]: row.a2,
        [A3]: row.a3,
      });
    }
  });

  it('applies the exchange counts the table says each division applies', () => {
    let container = playA2();

    // Each row's counts are the exchange the division applies *while playing that season*, so the
    // move out of season N lands the club counts of season N+1.
    for (let index = 0; index < SCHEDULE.length - 1; index++) {
      const row = SCHEDULE[index];
      const before = container;
      container = rollOver(before);

      expect({
        season: row.season,
        a1Relegates: moved(before, container, A1, A2),
        a2Promotes: moved(before, container, A2, A1),
        a2Relegates: moved(before, container, A2, A3),
        a3Promotes: moved(before, container, A3, A2),
      }).toEqual({
        season: row.season,
        a1Relegates: row.a1Relegates,
        a2Promotes: row.a2Promotes,
        a2Relegates: row.a2Relegates,
        a3Promotes: row.a3Promotes,
      });
    }
  });

  it('reshapes A3 the moment its field no longer fills eight groups', () => {
    let container = playA2();
    const shapes = [groupCount(byInternalName(container)[A3])];

    for (let season = 1; season < SCHEDULE.length; season++) {
      container = rollOver(container);
      shapes.push(groupCount(byInternalName(container)[A3]));
    }

    expect(shapes).toEqual(SCHEDULE.map((row) => row.a3Groups));
  });

  it('keeps the season count in step with the schedule', () => {
    let container = playA2();
    const first = byInternalName(container)[A2].matchContainer.currentSeason;

    for (let index = 1; index < SCHEDULE.length; index++) {
      container = rollOver(container);

      for (const championship of divisions(container)) {
        expect(championship.matchContainer.currentSeason - first).toBe(
          SCHEDULE[index].season - FIRST_SEASON
        );
      }
    }
  });

  it('leaves the promotion cap inert across the whole schedule', () => {
    // `getSustainablePromotionCount` reads the shape A3 is about to be played in: the floor is 16
    // only while it is played in 8 groups feeding an Oitavas, and 8 from the reduced shape onward.
    // A3 never falls below 26, so the cap must never bind — it always sends its full 4 up.
    let container = playA2();

    for (let index = 0; index < SCHEDULE.length - 1; index++) {
      const before = container;
      const a3 = byInternalName(before)[A3];
      container = rollOver(before);

      expect(a3.isPromotable && a3.numberOfPromotableTeams).toBe(4);
      expect(moved(before, container, A3, A2)).toBe(SCHEDULE[index].a3Promotes);
    }

    expect(counts(container)[A3]).toBe(SCHEDULE[SCHEDULE.length - 1].a3);
  });

  it('keeps every division playable in whichever shape it is now played in', () => {
    let container = playA2();

    for (let index = 1; index < SCHEDULE.length; index++) {
      container = rollOver(container);

      for (const championship of divisions(container)) {
        expect(championship.numberOfTeams).toBe(championship.teams.length);
        expect(championship.standings).toHaveLength(championship.teams.length);
        expect(championship.matchContainer.rounds.length).toBeGreaterThan(0);
        // A shape change carries no phase state of the shape it replaced.
        expect(championship.currentPhaseIndex).toBe(0);
        expect(championship.phaseParticipants).toEqual([]);
        expect(championship.accumulatedStandings).toEqual([]);
        expect(championship.firstPhaseStandings).toBeUndefined();
      }
    }
  });
});

describe('MS-104 — the roll-over draws on no randomness at all', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('never reaches for Math.random', () => {
    // `runEndOfChampionshipActions` takes no `dependencies`, because nothing on this path is
    // random: the exchange is read off tables and the fixtures are a rotation. Injecting an `rng`
    // would assert nothing, so the stronger claim is pinned instead.
    //
    // The spy goes up *after* `init`, which does draw on randomness — squad generation rolls player
    // attributes. Only the roll-over is under test here.
    let container = playA2();
    const random = jest.spyOn(Math, 'random');

    for (let index = 1; index < SCHEDULE.length; index++) container = rollOver(container);

    expect(random).not.toHaveBeenCalled();
    expect(counts(container)[A3]).toBe(SCHEDULE[SCHEDULE.length - 1].a3);
  });

  it('produces the same schedule twice from the same seed data', () => {
    const run = () => {
      let container = playA2();
      const trace: Record<string, number>[] = [counts(container)];
      for (let index = 1; index < SCHEDULE.length; index++) {
        container = rollOver(container);
        trace.push(counts(container));
      }
      return trace;
    };

    expect(run()).toEqual(run());
  });
});
