import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { rankStandings } from '../../../src/domain/features/standings/StandingsComparator';

// `src/setupTests.ts` stubs `crypto.randomUUID` to the constant 'mocked-uuid'. Every club would
// then share an id, and the roll-over — which removes and re-adds clubs by id — would be
// meaningless. Restore unique ids for this suite.
beforeAll(() => {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
    configurable: true,
  });
});

/**
 * Brings a season to its end without playing it.
 *
 * A phased championship is only over once its **last** phase has been played, so this fabricates the
 * state task 04 would have left behind: an ended final, a preserved 1ª Fase table, an accumulated
 * table, and a record of who reached each phase. The semifinalists are deliberately the clubs
 * ranked 5th–8th, so a roll-over that promotes the top four instead cannot pass.
 */
function finishSeason(championship: Championship): Championship {
  const endedRounds = championship.matchContainer.rounds.map((round) => ({
    ...round,
    status: 'ended' as const,
  }));

  if (!championship.phases?.length) {
    return {
      ...championship,
      matchContainer: {
        ...championship.matchContainer,
        currentRound: championship.matchContainer.totalRounds + 1,
        rounds: endedRounds,
      },
    };
  }

  const lastPhaseIndex = championship.phases.length - 1;
  const semifinalIndex = lastPhaseIndex - 1;
  // Rank first, so the semifinalists and the relegated clubs are picked off the same order — the
  // 5th–8th placed clubs are in the top 8 that advance, so they can never also be the bottom two.
  const ranked = rankStandings(championship.standings);
  const ids = ranked.map((standing) => standing.team.id);
  const semifinalists = ids.slice(4, 8);
  const finalists = semifinalists.slice(0, 2);

  const phaseParticipants: Championship['phaseParticipants'] = [];
  for (let phase = 0; phase <= lastPhaseIndex; phase++) phaseParticipants[phase] = ids;
  phaseParticipants[semifinalIndex] = semifinalists;
  phaseParticipants[lastPhaseIndex] = finalists;

  const lastRoundNumber = endedRounds.reduce((last, round) => Math.max(last, round.number), 0);

  return {
    ...championship,
    currentPhaseIndex: lastPhaseIndex,
    firstPhaseStandings: ranked,
    accumulatedStandings: ranked,
    phaseParticipants,
    survivingTeamIds: [finalists[0]],
    matchContainer: {
      ...championship.matchContainer,
      currentRound: lastRoundNumber + 2,
      totalRounds: lastRoundNumber + 1,
      rounds: [
        ...endedRounds,
        {
          id: `final-${championship.internalName}`,
          number: lastRoundNumber + 1,
          matches: [],
          status: 'ended' as const,
          phaseIndex: lastPhaseIndex,
          phaseName: championship.phases[lastPhaseIndex].name,
        },
      ],
    },
  };
}

function finishAll(container: ChampionshipContainer): ChampionshipContainer {
  return {
    playableChampionship: finishSeason(container.playableChampionship),
    promotionChampionship:
      container.promotionChampionship && finishSeason(container.promotionChampionship),
    relegationChampionship:
      container.relegationChampionship && finishSeason(container.relegationChampionship),
  };
}

function rollOver(container: ChampionshipContainer): ChampionshipContainer {
  const result = ChampionshipService.runEndOfChampionshipActions(finishAll(container));
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

function init(internalName: string): ChampionshipContainer {
  const result = ChampionshipService.initChampionships(internalName);
  if (!result.succeeded) throw new Error(result.error?.message);
  return result.getResult();
}

function counts(container: ChampionshipContainer): Record<string, number> {
  const entries: Record<string, number> = {};
  for (const championship of [
    container.playableChampionship,
    container.promotionChampionship,
    container.relegationChampionship,
  ]) {
    if (championship) entries[championship.internalName] = championship.teams.length;
  }
  return entries;
}

function allTeamIds(container: ChampionshipContainer): string[] {
  return [
    container.playableChampionship,
    container.promotionChampionship,
    container.relegationChampionship,
  ]
    .filter((championship): championship is Championship => Boolean(championship))
    .flatMap((championship) => championship.teams.map((team) => team.id));
}

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
  it.each(['brasileirao-serie-a', 'brasileirao-serie-b'])(
    'keeps %s and its partner at 20 clubs over three roll-overs',
    (internalName) => {
      let container = init(internalName);
      const initialIds = new Set(allTeamIds(container));

      for (let season = 0; season < 3; season++) {
        container = rollOver(container);

        expect(counts(container)).toEqual({
          'brasileirao-serie-a': 20,
          'brasileirao-serie-b': 20,
        });

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
