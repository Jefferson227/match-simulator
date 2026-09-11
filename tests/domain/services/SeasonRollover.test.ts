import { beforeAll, describe, expect, it } from '@jest/globals';
import { allTeamIds, counts, init, rollOver, useUniqueTeamIds } from '../../support/seasonHarness';

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
        container.playableChampionship,
        container.promotionChampionship!,
        container.relegationChampionship!,
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
    expect(container.relegationChampionship!.matchContainer.rounds.length).toBeGreaterThan(0);
  });
});

describe('season roll-over — the women’s pyramid, playing A1', () => {
  it('grows A1 to 20 and stops, at the cost of A2, whose lower border is not modelled', () => {
    let container = init('brasileirao-feminino-serie-a1');

    expect(counts(container)).toEqual({
      'brasileirao-feminino-serie-a1': 18,
      'brasileirao-feminino-serie-a2': 16,
    });

    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);
    // A2's lower border does not exist in this container — A3 is not loaded when A1 is playable —
    // so the four clubs it sends up are replaced by only the two A1 relegates. It loses 2 clubs
    // once, then stabilises, because A1 switches to 4 down / 4 up at its target.
    expect(counts(container)['brasileirao-feminino-serie-a2']).toBe(14);

    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);
    expect(counts(container)['brasileirao-feminino-serie-a2']).toBe(14);

    container = rollOver(container);
    expect(counts(container)['brasileirao-feminino-serie-a1']).toBe(20);
    expect(counts(container)['brasileirao-feminino-serie-a2']).toBe(14);
  });
});

describe('season roll-over — the men’s divisions are untouched', () => {
  // Série B's relegation neighbour is Série C since MS-106, so its container holds three divisions.
  it.each([
    ['brasileirao-serie-a', { 'brasileirao-serie-a': 20, 'brasileirao-serie-b': 20 }],
    [
      'brasileirao-serie-b',
      { 'brasileirao-serie-a': 20, 'brasileirao-serie-b': 20, 'brasileirao-serie-c': 20 },
    ],
  ])(
    'keeps %s and its neighbours at 20 clubs over three roll-overs',
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
    const beforeTop = new Set(before.playableChampionship.teams.map((team) => team.id));

    const after = rollOver(before);
    const afterTop = after.playableChampionship.teams.map((team) => team.id);

    expect(afterTop.filter((id) => !beforeTop.has(id))).toHaveLength(4);
    expect(after.playableChampionship.phases).toBeUndefined();
    expect(after.playableChampionship.type).toBe('double-round-robin');
    expect(after.playableChampionship.matchContainer.totalRounds).toBe(38);
  });
});
