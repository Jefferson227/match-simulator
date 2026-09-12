/**
 * MS-107: the championship container follows the human's club when it changes division.
 *
 * Before MS-107 the roll-over exchanged clubs but left `playableChampionship` on the division the
 * human started in, so a promoted or relegated club vanished from every screen that reads the human
 * off the playable division. See `wiki/decisions/ms-107-container-recentring.md`.
 *
 * Scripted by seed order (`ScriptedSeason`): the club listed first in `teamNames` wins every match,
 * so seed 0 always goes up and the last seed always goes down.
 */
import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
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

/** The three slots by `internalName`, so a container's shape reads as one assertion. */
const slotsOf = (container: ChampionshipContainer) => ({
  playable: container.playableChampionship.internalName,
  promotion: container.promotionChampionship?.internalName,
  relegation: container.relegationChampionship?.internalName,
});

/** Rolls `internalName` over with the human on the club at `seedIndex`. */
function rollOverWithHumanAt(internalName: string, seedIndex: number): ChampionshipContainer {
  const season = new ScriptedSeason(internalName);
  season.assignHuman(seedIndex);
  season.playToEnd();
  return season.rollOver();
}

/** Proves the human's club is where every screen looks for it. */
const humanIsInPlayableDivision = (container: ChampionshipContainer): boolean =>
  ChampionshipService.getTeamControlledByHuman(container.playableChampionship).succeeded;

describe("men's pyramid re-centres on the human's new division", () => {
  let promoted: ChampionshipContainer;
  let relegated: ChampionshipContainer;

  beforeAll(() => {
    // Série D has 64 clubs and promotes its four semifinalists; seed 0 wins every tie.
    promoted = rollOverWithHumanAt(D, 0);
    // Série B relegates the bottom four of a 20-club table; the last seed loses every match.
    relegated = rollOverWithHumanAt(B, 19);
  });

  it('puts Série C playable with B above and D below when the human is promoted D → C', () => {
    expect(slotsOf(promoted)).toEqual({ playable: C, promotion: B, relegation: D });
    expect(humanIsInPlayableDivision(promoted)).toBe(true);
    expect(promoted.playableChampionship.hasTeamControlledByHuman).toBe(true);
  });

  it('leaves neither neighbour claiming the human after a promotion', () => {
    expect(promoted.promotionChampionship?.hasTeamControlledByHuman).toBe(false);
    expect(promoted.relegationChampionship?.hasTeamControlledByHuman).toBe(false);
  });

  it('drops exactly one division when the human is relegated B → C', () => {
    expect(slotsOf(relegated)).toEqual({ playable: C, promotion: B, relegation: D });
    expect(humanIsInPlayableDivision(relegated)).toBe(true);
  });

  it('leaves the container untouched when the human stays in its division', () => {
    // Seed 9 of 20 beats every club below it and loses to every club above: mid-table, so neither
    // the top four nor the bottom four.
    const season = new ScriptedSeason(B);
    season.assignHuman(9);
    season.playToEnd();
    const before = season.container;
    const after = season.rollOver();

    expect(slotsOf(after)).toEqual({ playable: B, promotion: A, relegation: C });
    expect(humanIsInPlayableDivision(after)).toBe(true);
    // Same division objects carried through: no reseed, no slot moved.
    expect(after.playableChampionship.id).toBe(before.playableChampionship.id);
    expect(after.promotionChampionship?.id).toBe(before.promotionChampionship?.id);
    expect(after.relegationChampionship?.id).toBe(before.relegationChampionship?.id);
  });
});

describe("women's pyramid re-centres on the human's new division", () => {
  it('puts A2 playable with A1 above and A3 below when the human is promoted A3 → A2', () => {
    const container = rollOverWithHumanAt(A3, 0);

    expect(slotsOf(container)).toEqual({ playable: A2, promotion: A1, relegation: A3 });
    expect(humanIsInPlayableDivision(container)).toBe(true);
  });

  it('re-centres on A3 when the human is relegated A2 → A3', () => {
    const container = rollOverWithHumanAt(A2, 15);

    expect(slotsOf(container)).toEqual({ playable: A3, promotion: A2, relegation: undefined });
    expect(humanIsInPlayableDivision(container)).toBe(true);
  });

  it('leaves the container untouched when the human stays in A2', () => {
    // Seed 7 of 16 reaches the quarter-finals and loses there, so it is neither a semifinalist
    // (A2 promotes its four) nor in the bottom two of the 1ª Fase table.
    const container = rollOverWithHumanAt(A2, 7);

    expect(slotsOf(container)).toEqual({ playable: A2, promotion: A1, relegation: A3 });
    expect(humanIsInPlayableDivision(container)).toBe(true);
  });
});

describe('pyramid ends leave the corresponding slot absent', () => {
  it('has no promotion slot once the human reaches Série A', () => {
    const container = rollOverWithHumanAt(B, 0);

    expect(slotsOf(container)).toEqual({ playable: A, promotion: undefined, relegation: B });
    expect(container.playableChampionship.isPromotable).toBe(false);
    expect(container.playableChampionship.isRelegatable).toBe(true);
    expect(humanIsInPlayableDivision(container)).toBe(true);
  });

  it('has no promotion slot once the human reaches Série A1', () => {
    const container = rollOverWithHumanAt(A2, 0);

    expect(slotsOf(container)).toEqual({ playable: A1, promotion: undefined, relegation: A2 });
    expect(container.playableChampionship.isPromotable).toBe(false);
    expect(container.playableChampionship.isRelegatable).toBe(true);
  });

  it('has no relegation slot when the human drops back into Série D', () => {
    const container = rollOverWithHumanAt(C, 19);

    expect(slotsOf(container)).toEqual({ playable: D, promotion: C, relegation: undefined });
    expect(container.playableChampionship.isRelegatable).toBe(false);
    expect(container.playableChampionship.isPromotable).toBe(true);
    expect(humanIsInPlayableDivision(container)).toBe(true);
  });
});

describe('the newly-entered neighbour is seeded as a new game would seed it', () => {
  it('arrives with generated fixtures and initialised phase state', () => {
    // Série D was outside the container while the human played Série B, so re-centring on C has to
    // load it from `championships.json`.
    const container = rollOverWithHumanAt(B, 19);
    const seeded = container.relegationChampionship!;

    expect(seeded.internalName).toBe(D);
    expect(seeded.teams.length).toBeGreaterThan(0);
    expect(seeded.matchContainer.rounds.length).toBeGreaterThan(0);
    expect(seeded.matchContainer.totalRounds).toBeGreaterThan(0);
    expect(seeded.currentPhaseIndex).toBe(0);
    expect(seeded.survivingTeamIds).toEqual(seeded.teams.map((team) => team.id));
    expect(seeded.phaseParticipants).toEqual([]);
    expect(seeded.phaseStandings).toEqual([]);
    expect(seeded.firstPhaseStandings).toBeUndefined();
  });

  it('shares the season the human is now playing, not the seed default', () => {
    const container = rollOverWithHumanAt(B, 19);

    expect(container.relegationChampionship?.matchContainer.currentSeason).toBe(
      container.playableChampionship.matchContainer.currentSeason
    );
  });

  it('carries the divisions already in the container with their rolled-over state', () => {
    const season = new ScriptedSeason(D);
    season.assignHuman(0);
    season.playToEnd();
    const playedSerieC = season.container.promotionChampionship!;
    const container = season.rollOver();

    // C was the promotion slot and is now playable — the same division, rolled over, not reseeded.
    expect(container.playableChampionship.id).toBe(playedSerieC.id);
    expect(container.playableChampionship.matchContainer.currentSeason).toBe(
      playedSerieC.matchContainer.currentSeason + 1
    );
  });
});
