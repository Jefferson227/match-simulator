/**
 * MS-109: the human changing division moves only the playable pointer.
 *
 * The container holds the whole pyramid, so a promoted or relegated human club is already in a
 * division the container carries, with that division's own state. Before MS-109 the container was a
 * three-slot window re-centred on the human's division (MS-107), and a division dropping out of it
 * lost its state. See `wiki/decisions/ms-109-full-pyramid-container.md`.
 *
 * Scripted by seed order (`ScriptedSeason`): the club listed first in `teamNames` wins every match,
 * so seed 0 always goes up and the last seed always goes down.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import {
  getChampionshipByInternalName,
  getDivisionAbove,
  getDivisionBelow,
  getPlayableChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const A = 'brasileirao-serie-a';
const B = 'brasileirao-serie-b';
const C = 'brasileirao-serie-c';
const D = 'brasileirao-serie-d';
const A1 = 'brasileirao-feminino-serie-a1';
const A2 = 'brasileirao-feminino-serie-a2';
const A3 = 'brasileirao-feminino-serie-a3';

const MENS = [A, B, C, D];
const WOMENS = [A1, A2, A3];

/** The pyramid's shape: division names and ids, which a pointer move must leave alone. */
const shapeOf = (container: ChampionshipContainer) =>
  container.championships.map((championship) => [championship.internalName, championship.id]);

/** Plays `internalName`'s season with the human on the club at `seedIndex`, and rolls it over. */
function rollOverWithHumanAt(internalName: string, seedIndex: number) {
  const season = new ScriptedSeason(internalName).assignHuman(seedIndex);
  season.playToEnd();
  const before = season.container;
  return { before, after: season.rollOver() };
}

/** Proves the human's club is where every screen looks for it. */
const humanIsInPlayableDivision = (container: ChampionshipContainer): boolean =>
  ChampionshipService.getTeamControlledByHuman(getPlayableChampionship(container)).succeeded;

const humanFlags = (container: ChampionshipContainer) =>
  container.championships.map((championship) => championship.hasTeamControlledByHuman);

describe.each([
  ['promoted D → C', D, 0, C, MENS],
  ['relegated B → C', B, 19, C, MENS],
  ['promoted A3 → A2', A3, 0, A2, WOMENS],
  ['relegated A2 → A3', A2, 15, A3, WOMENS],
])('human %s', (_, from, seedIndex, to, pyramid) => {
  let before: ChampionshipContainer;
  let after: ChampionshipContainer;

  beforeAll(() => {
    ({ before, after } = rollOverWithHumanAt(from, seedIndex));
  });

  it('points the container at the new division', () => {
    expect(before.playableInternalName).toBe(from);
    expect(after.playableInternalName).toBe(to);
    expect(humanIsInPlayableDivision(after)).toBe(true);
  });

  it('keeps every division, in tier order, as the same division', () => {
    expect(after.championships.map((championship) => championship.internalName)).toEqual(pyramid);
    expect(shapeOf(after)).toEqual(shapeOf(before));
  });

  it('flags only the new division as the human’s', () => {
    expect(humanFlags(after)).toEqual(pyramid.map((internalName) => internalName === to));
  });
});

describe('a human who stays put', () => {
  it('leaves the pointer and the pyramid alone', () => {
    // Seed 9 of 20 beats every club below it and loses to every club above: mid-table.
    const { before, after } = rollOverWithHumanAt(B, 9);

    expect(after.playableInternalName).toBe(B);
    expect(shapeOf(after)).toEqual(shapeOf(before));
    expect(humanFlags(after)).toEqual([false, true, false, false]);
  });
});

describe('the ends of the pyramid', () => {
  it('has no division above the top tier', () => {
    const { after } = rollOverWithHumanAt(B, 0);
    const serieA = getPlayableChampionship(after);

    expect(serieA.internalName).toBe(A);
    expect(getDivisionAbove(after, serieA)).toBeUndefined();
    expect(getDivisionBelow(after, serieA)?.internalName).toBe(B);
  });

  it('has no division above A1', () => {
    const { after } = rollOverWithHumanAt(A2, 0);
    const a1 = getPlayableChampionship(after);

    expect(a1.internalName).toBe(A1);
    expect(getDivisionAbove(after, a1)).toBeUndefined();
  });

  it('has no division below the bottom tier', () => {
    const { after } = rollOverWithHumanAt(C, 19);
    const serieD = getPlayableChampionship(after);

    expect(serieD.internalName).toBe(D);
    expect(getDivisionBelow(after, serieD)).toBeUndefined();
    expect(getDivisionAbove(after, serieD)?.internalName).toBe(C);
  });
});

describe('D → C → B → C keeps every division’s own state (the MS-107 loss is gone)', () => {
  let season: ScriptedSeason;
  const playable: string[] = [];
  const everyClubEverSeen = new Set<string>();
  let serieCId: string;
  let serieDSeedIds: Set<string>;

  const record = () => {
    playable.push(season.container.playableInternalName);
    season.container.championships.forEach((championship) =>
      championship.teams.forEach((team) => everyClubEverSeen.add(team.id))
    );
  };

  beforeAll(() => {
    season = new ScriptedSeason(D).assignHuman(0);
    serieCId = season.division(C).id;
    serieDSeedIds = new Set(season.division(D).teams.map((team) => team.id));
    record();

    // Promoted out of D and C, then relegated out of B.
    season.humanAlways('wins').playSeasonAndRollOver();
    record();
    season.playSeasonAndRollOver();
    record();
    season.humanAlways('loses').playSeasonAndRollOver();
    record();
  });

  it('follows the human D → C → B → C', () => {
    expect(playable).toEqual([D, C, B, C]);
    expect(humanIsInPlayableDivision(season.container)).toBe(true);
  });

  it('never reseeds Série C: the same division has rolled over three seasons', () => {
    const serieC = getChampionshipByInternalName(season.container, C)!;
    expect(serieC.id).toBe(serieCId);
    expect(serieC.matchContainer.currentSeason).toBe(
      getChampionshipByInternalName(season.container, D)!.matchContainer.currentSeason
    );
  });

  it('keeps Série C’s actual clubs — including clubs that came up from Série D — not its seed list', () => {
    const serieCTeams = getChampionshipByInternalName(season.container, C)!.teams;
    expect(serieCTeams.some((team) => serieDSeedIds.has(team.id))).toBe(true);
  });

  it('never loads a club mid-game: the clubs of the pyramid are the ones it kicked off with', () => {
    const clubCount = season.container.championships.reduce(
      (total, championship) => total + championship.teams.length,
      0
    );
    expect(clubCount).toBe(20 + 20 + 20 + 64);
    expect(everyClubEverSeen.size).toBe(clubCount);
  });
});
