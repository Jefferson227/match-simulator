/**
 * MS-109: every boundary of the pyramid exchanges clubs at roll-over, not only the ones touching the
 * playable division.
 *
 * Before MS-109 the human playing Série D meant Série A and B were never instantiated, and Série C's
 * top clubs never left for B. The exchange is now computed for every adjacent pair of tiers from
 * the pre-roll-over tables and applied at once.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { getChampionshipByInternalName } from '../../../src/domain/features/pyramid/Pyramid';
import { buildFinalClassification } from '../../../src/domain/features/phases/PhaseProgression';
import { counts, useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const A = 'brasileirao-serie-a';
const B = 'brasileirao-serie-b';
const C = 'brasileirao-serie-c';
const D = 'brasileirao-serie-d';
const A1 = 'brasileirao-feminino-serie-a1';
const A2 = 'brasileirao-feminino-serie-a2';
const A3 = 'brasileirao-feminino-serie-a3';

const division = (container: ChampionshipContainer, internalName: string): Championship =>
  getChampionshipByInternalName(container, internalName)!;

const idsOf = (championship: Championship) => new Set(championship.teams.map((team) => team.id));

const minus = (left: Set<string>, right: Set<string>) =>
  new Set([...left].filter((id) => !right.has(id)));

const classificationIds = (championship: Championship) =>
  buildFinalClassification(championship).map((standing) => standing.team.id);

describe('with the human in Série D, the divisions above it still exchange', () => {
  let before: ChampionshipContainer;
  let after: ChampionshipContainer;

  beforeAll(() => {
    // Seed 9 of D stays in D, so the pointer does not move and only the AI divisions' exchange is
    // under test above it.
    const season = new ScriptedSeason(D).assignHuman(9);
    season.playToEnd();
    before = season.container;
    after = season.rollOver();
  });

  it('keeps the human in Série D', () => {
    expect(after.playableInternalName).toBe(D);
  });

  it('plays every AI division to its end before the roll-over reads it', () => {
    for (const internalName of [A, B, C]) {
      const { currentRound, rounds } = division(before, internalName).matchContainer;
      expect(rounds.some((round) => round.number === currentRound)).toBe(false);
    }
  });

  it('sends Série B’s top four up to Série A', () => {
    const promoted = classificationIds(division(before, B)).slice(0, 4);
    const serieA = idsOf(division(after, A));

    expect(promoted).toHaveLength(4);
    promoted.forEach((id) => expect(serieA.has(id)).toBe(true));
  });

  it('sends Série A’s bottom four down to Série B', () => {
    const relegated = classificationIds(division(before, A)).slice(-4);
    const serieB = idsOf(division(after, B));

    relegated.forEach((id) => expect(serieB.has(id)).toBe(true));
  });

  it('applies both of Série C’s boundaries in the one roll-over', () => {
    const serieCBefore = idsOf(division(before, C));
    const serieCAfter = idsOf(division(after, C));
    const left = minus(serieCBefore, serieCAfter);
    const arrived = minus(serieCAfter, serieCBefore);

    // Out: 4 promoted into B and 4 relegated into D.
    expect(left.size).toBe(8);
    expect([...left].filter((id) => idsOf(division(after, B)).has(id))).toHaveLength(4);
    expect([...left].filter((id) => idsOf(division(after, D)).has(id))).toHaveLength(4);

    // In: 4 relegated from B and 4 promoted from D.
    expect(arrived.size).toBe(8);
    expect([...arrived].filter((id) => idsOf(division(before, B)).has(id))).toHaveLength(4);
    expect([...arrived].filter((id) => idsOf(division(before, D)).has(id))).toHaveLength(4);
  });

  it('computes every boundary off the pre-roll-over tables', () => {
    // Série B's arrivals come straight from last season's A and C, and none of its leavers comes
    // back in: nothing a boundary read had already been moved by another boundary.
    const serieBBefore = idsOf(division(before, B));
    const serieBAfter = idsOf(division(after, B));
    const arrived = [...minus(serieBAfter, serieBBefore)];
    const left = minus(serieBBefore, serieBAfter);

    expect(arrived.filter((id) => idsOf(division(before, A)).has(id))).toHaveLength(4);
    expect(arrived.filter((id) => idsOf(division(before, C)).has(id))).toHaveLength(4);
    expect(left.size).toBe(8);
    arrived.forEach((id) => expect(left.has(id)).toBe(false));
  });

  it('resets every division for the same next season', () => {
    const seasons = after.championships.map(
      (championship) => championship.matchContainer.currentSeason
    );
    expect(new Set(seasons)).toEqual(
      new Set([before.championships[0].matchContainer.currentSeason + 1])
    );
    after.championships.forEach((championship) => {
      expect(championship.matchContainer.currentRound).toBe(1);
      expect(championship.standings.every((standing) => standing.points === 0)).toBe(true);
    });
  });
});

describe('club counts follow each division’s rules across three seasons', () => {
  function countsOverSeasons(entry: string, seedIndex: number) {
    const season = new ScriptedSeason(entry).assignHuman(seedIndex);
    const seen = [counts(season.container)];
    for (let played = 0; played < 3; played++) seen.push(counts(season.playSeasonAndRollOver()));
    return seen;
  }

  it('keeps the men’s pyramid at 20 / 20 / 20 / 64', () => {
    const stable = { [A]: 20, [B]: 20, [C]: 20, [D]: 64 };
    expect(countsOverSeasons(D, 9)).toEqual([stable, stable, stable, stable]);
  });

  it('grows A1 to its target of 20 while A3, which is never backfilled, shrinks', () => {
    // A1 relegates 2 and takes A2's 4 semifinalists until it reaches 20, then relegates 4. A2
    // relegates 2 and takes A3's 4 semifinalists. A3 has no division below it to refill from.
    expect(countsOverSeasons(A3, 7)).toEqual([
      { [A1]: 18, [A2]: 16, [A3]: 32 },
      { [A1]: 20, [A2]: 16, [A3]: 30 },
      { [A1]: 20, [A2]: 18, [A3]: 28 },
      { [A1]: 20, [A2]: 20, [A3]: 26 },
    ]);
  });
});
