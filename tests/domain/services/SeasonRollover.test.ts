import { beforeAll, describe, expect, it } from '@jest/globals';
import { Team } from '../../../src/domain/models/Team';
import { allTeamIds, counts, init, rollOver, useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';
import { aboveOf, belowOf, playableOf } from '../../support/pyramidSlots';

beforeAll(useUniqueTeamIds);

describe('season roll-over — the women’s pyramid, playing A2', () => {
  it('takes A1 from 18 to 20 and holds it there over three seasons, while A2 grows to its own target', () => {
    let container = init('brasileirao-feminino-serie-a2');

    expect(counts(container)).toEqual({
      'brasileirao-feminino-serie-a2': 16,
      'brasileirao-feminino-serie-a1': 18,
      'brasileirao-feminino-serie-a3': 32,
    });

    // Season 1: A1 still relegates 2 and takes 4 up, so it reaches its target of 20. A2's flows
    // cancel exactly at 16 — 4 up, 2 down, 2 in from A1, 4 in from A3.
    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);
    expect(counts(container)['brasileirao-feminino-serie-a2']).toBe(16);

    // Season 2: A1 is at target, so it switches to 4 down / 4 up and holds at 20 — never 22.
    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);

    // Season 3: still stable.
    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);
  });

  it('never duplicates or loses a club across three roll-overs', () => {
    let container = init('brasileirao-feminino-serie-a2');
    const initialIds = new Set(allTeamIds(container));

    for (let season = 0; season < 3; season++) {
      container = rollOver(container);
      const ids = allTeamIds(container);

      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(initialIds.has(id)).toBe(true);
    }

    // No club vanished either: the three divisions still hold the whole 66-club field.
    expect(new Set(allTeamIds(container)).size).toBe(initialIds.size);
  });

  it('keeps every division playable after each roll-over', () => {
    let container = init('brasileirao-feminino-serie-a2');

    for (let season = 0; season < 3; season++) {
      container = rollOver(container);

      for (const championship of [
        playableOf(container),
        aboveOf(container)!,
        belowOf(container)!,
      ]) {
        expect(championship.numberOfTeams).toBe(championship.teams.length);
        expect(championship.standings).toHaveLength(championship.teams.length);
        expect(championship.matchContainer.rounds.length).toBeGreaterThan(0);
        expect(championship.currentPhaseIndex).toBe(0);
      }
    }
  });

  it('lets A3 shrink, since CBF re-composes it from state champions the game cannot seed', () => {
    let container = init('brasileirao-feminino-serie-a2');
    const sizes: number[] = [];

    for (let season = 0; season < 3; season++) {
      container = rollOver(container);
      sizes.push(counts(container)['brasileirao-feminino-serie-a3']);
    }

    // 4 up, 2 back down each season until A2 reaches its own target.
    expect(sizes).toEqual([30, 28, 26]);
    // ...but its group stage is still generated, one round-robin per group.
    expect(belowOf(container)!.matchContainer.rounds.length).toBeGreaterThan(0);
  });
});

describe('season roll-over — the women’s pyramid, playing A1', () => {
  it('grows A1 to 20 and stops, with A2 refilled from A3 now that the pyramid is whole', () => {
    let container = init('brasileirao-feminino-serie-a1');

    expect(counts(container)).toEqual({
      'brasileirao-feminino-serie-a1': 18,
      'brasileirao-feminino-serie-a2': 16,
      'brasileirao-feminino-serie-a3': 32,
    });

    // Before MS-109 A3 was not loaded while A1 was playable, so A2 lost the 4 it sent up and got
    // only A1's relegated clubs back, settling at 14. The A2 ↔ A3 boundary now exchanges too, so
    // A2 is refilled with A3's 4 semifinalists and grows exactly as it does with A2 playable.
    const seasons = [counts(container)];
    for (let season = 0; season < 3; season++) {
      container = rollOver(container);
      seasons.push(counts(container));
    }

    expect(seasons.map((season) => season['brasileirao-feminino-serie-a1'])).toEqual([
      18, 20, 20, 20,
    ]);
    expect(seasons.map((season) => season['brasileirao-feminino-serie-a2'])).toEqual([
      16, 16, 18, 20,
    ]);
    expect(seasons.map((season) => season['brasileirao-feminino-serie-a3'])).toEqual([
      32, 30, 28, 26,
    ]);
  });
});

const MENS_COUNTS = {
  'brasileirao-serie-a': 20,
  'brasileirao-serie-b': 20,
  'brasileirao-serie-c': 20,
  'brasileirao-serie-d': 64,
};

describe('season roll-over — the men’s divisions are untouched', () => {
  // Since MS-109 every men's container holds the whole pyramid, whichever division is playable.
  it.each([
    ['brasileirao-serie-a', MENS_COUNTS],
    ['brasileirao-serie-b', MENS_COUNTS],
  ])(
    'keeps %s and the rest of the pyramid at their club counts over three roll-overs',
    (internalName, expectedCounts) => {
      let container = init(internalName);
      const initialIds = new Set(allTeamIds(container));

      for (let season = 0; season < 3; season++) {
        container = rollOver(container);

        expect(counts(container)).toEqual(expectedCounts);

        const ids = allTeamIds(container);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(ids).size).toBe(initialIds.size);
      }
    }
  );

  it('exchanges exactly 4 clubs a season between Série A and Série B', () => {
    const before = init('brasileirao-serie-a');
    const beforeTop = new Set(playableOf(before).teams.map((team) => team.id));

    const after = rollOver(before);
    const afterTop = playableOf(after).teams.map((team) => team.id);

    expect(afterTop.filter((id) => !beforeTop.has(id))).toHaveLength(4);
    expect(playableOf(after).phases).toBeUndefined();
    expect(playableOf(after).type).toBe('double-round-robin');
    expect(playableOf(after).matchContainer.totalRounds).toBe(38);
  });
});

describe('the men’s containers load their real neighbours (MS-106)', () => {
  const neighbours = (internalName: string) => {
    const container = init(internalName);
    return {
      promotion: aboveOf(container)?.internalName,
      relegation: belowOf(container)?.internalName,
    };
  };

  it('loads Série A with Série B below', () => {
    expect(neighbours('brasileirao-serie-a')).toEqual({
      promotion: undefined,
      relegation: 'brasileirao-serie-b',
    });
  });

  it('loads Série B between Série A and Série C', () => {
    expect(neighbours('brasileirao-serie-b')).toEqual({
      promotion: 'brasileirao-serie-a',
      relegation: 'brasileirao-serie-c',
    });
  });

  it('loads Série C between Série B and Série D', () => {
    expect(neighbours('brasileirao-serie-c')).toEqual({
      promotion: 'brasileirao-serie-b',
      relegation: 'brasileirao-serie-d',
    });
  });

  it('loads Série D with only Série C above — it relegates nobody', () => {
    expect(neighbours('brasileirao-serie-d')).toEqual({
      promotion: 'brasileirao-serie-c',
      relegation: undefined,
    });
  });
});

/**
 * Indexes of `after` still holding the club `before` had there. Série D deals its groups in list
 * order, so a kept index is a kept group slot.
 */
function keptSlots(before: Team['id'][], after: Team['id'][]): number {
  return before.filter((id, index) => after[index] === id).length;
}

describe('season roll-over — the men’s lower divisions, played for three seasons', () => {
  describe('with the human in Série D (D plays, A to C are AI divisions)', () => {
    const sizes: Record<string, number>[] = [];
    const slotsKept: number[] = [];
    const exchanged: number[] = [];

    beforeAll(() => {
      const season = new ScriptedSeason('brasileirao-serie-d');
      for (let year = 0; year < 3; year++) {
        const before = season.championship.teams.map((team) => team.id);
        const next = season.playSeasonAndRollOver();
        const after = playableOf(next).teams.map((team) => team.id);

        sizes.push(counts(next));
        slotsKept.push(keptSlots(before, after));
        exchanged.push(after.filter((id) => !before.includes(id)).length);
      }
    });

    it('keeps D at 64 and every division above it at 20 every season', () => {
      expect(sizes).toEqual(Array(3).fill(MENS_COUNTS));
    });

    it('exchanges 4 clubs and keeps the other 60 in their group slots', () => {
      expect(exchanged).toEqual([4, 4, 4]);
      expect(slotsKept).toEqual([60, 60, 60]);
    });
  });

  describe('with the human in Série C (C plays; A, B and D are AI divisions)', () => {
    const sizes: Record<string, number>[] = [];
    const slotsKept: number[] = [];
    const idsPerSeason: string[][] = [];

    beforeAll(() => {
      const season = new ScriptedSeason('brasileirao-serie-c');
      idsPerSeason.push(allTeamIds(season.container));
      for (let year = 0; year < 3; year++) {
        const before = belowOf(season.container)!.teams.map((team) => team.id);
        const next = season.playSeasonAndRollOver();
        const after = belowOf(next)!.teams.map((team) => team.id);

        sizes.push(counts(next));
        slotsKept.push(keptSlots(before, after));
        idsPerSeason.push(allTeamIds(next));
      }
    });

    it('keeps C at 20, B at 20 and D at 64 every season', () => {
      expect(sizes).toEqual(Array(3).fill(MENS_COUNTS));
    });

    it('keeps D’s 60 non-exchanged clubs in their group slots while D is the AI neighbour', () => {
      expect(slotsKept).toEqual([60, 60, 60]);
    });

    it('never duplicates or loses a club across the pyramid', () => {
      const initial = new Set(idsPerSeason[0]);
      for (const ids of idsPerSeason) {
        expect(new Set(ids).size).toBe(20 + 20 + 20 + 64);
        for (const id of ids) expect(initial.has(id)).toBe(true);
      }
    });
  });
});
