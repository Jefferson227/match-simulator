import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import { isPhasedChampionshipOver } from '../../../src/domain/features/phases/PhaseProgression';
import { bracketSeedOrder } from '../../../src/domain/features/fixture-generation/KnockoutBracket';
import { rankStandings } from '../../../src/domain/features/standings/StandingsComparator';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const teamIds = (championship: Championship | undefined) =>
  new Set(championship?.teams.map((team) => team.id));

describe('Série C 2025 replayed from the seed (REC C Arts. 12–22)', () => {
  // Built in `beforeAll`, after `useUniqueTeamIds` — at collection time every club id would be the
  // stubbed 'mocked-uuid'.
  let season: ScriptedSeason;
  let secondPhaseGroups: string[][];
  let next: ChampionshipContainer;
  const byName = (name: string) => season.championship.teams[season.names.indexOf(name)];

  beforeAll(() => {
    season = new ScriptedSeason('brasileirao-serie-c');
    season.playUntilPhase(1);
    secondPhaseGroups = season.groups(1);
    season.playToEnd();
    next = season.rollOver();
  });

  it('plays 19 + 6 + 2 rounds to a champion', () => {
    expect(isPhasedChampionshipOver(season.championship)).toBe(true);
    expect(season.championship.matchContainer.rounds.map((round) => round.phaseIndex)).toEqual([
      ...Array(19).fill(0),
      ...Array(6).fill(1),
      2,
      2,
    ]);
    expect(season.championship.survivingTeamIds).toEqual([byName(season.names[0]).id]);
  });

  it('deals the 1ª Fase top 8 into 2ª Fase groups 1-4-5-8 / 2-3-6-7', () => {
    // The 1ª Fase table follows seed order, so 1º…8º are the first eight names.
    const [first, second, third, fourth, fifth, sixth, seventh, eighth] = season.names;
    expect(secondPhaseGroups).toEqual([
      [first, fourth, fifth, eighth],
      [second, third, sixth, seventh],
    ]);
  });

  it('pairs the two 2ª Fase group winners in the final', () => {
    expect(season.ties(2).flat().sort()).toEqual([season.names[0], season.names[1]].sort());
  });

  it('promotes the top 2 of each 2ª Fase group into Série B', () => {
    const serieB = teamIds(next.promotionChampionship);
    const [first, second, third, fourth] = season.names;

    for (const name of [first, fourth, second, third])
      expect(serieB.has(byName(name).id)).toBe(true);
    expect(serieB.has(byName(season.names[4]).id)).toBe(false);
  });

  it('relegates the bottom 4 of the 1ª Fase into Série D', () => {
    const serieD = teamIds(next.relegationChampionship);

    for (const name of season.names.slice(16)) expect(serieD.has(byName(name).id)).toBe(true);
    for (const name of season.names.slice(16)) {
      expect(teamIds(next.playableChampionship).has(byName(name).id)).toBe(false);
    }
  });

  it('stays at 20, with Série B at 20 and Série D at 64', () => {
    expect(next.playableChampionship.teams).toHaveLength(20);
    expect(next.promotionChampionship!.teams).toHaveLength(20);
    expect(next.relegationChampionship!.teams).toHaveLength(64);
  });
});

describe('Série D 2025 replayed from the seed (REC D Arts. 13–21, Anexo B)', () => {
  let season: ScriptedSeason;
  let accumulatedBeforeQuartas: string[];
  let thirdPhaseWinners: string[];
  const byName = (name: string) => season.championship.teams[season.names.indexOf(name)];

  beforeAll(() => {
    season = new ScriptedSeason('brasileirao-serie-d');
    season.playUntilPhase(3);
    // The Bloco as the 3ª Fase left it: the survivors ranked on accumulated points (Art. 18 §2).
    // The 3ª Fase winner of each tie is the club listed earlier.
    thirdPhaseWinners = season
      .ties(2)
      .map(([host, visitor]) =>
        season.names.indexOf(host) < season.names.indexOf(visitor) ? host : visitor
      );
    const survivors = new Set(thirdPhaseWinners.map((name) => byName(name).id));
    accumulatedBeforeQuartas = rankStandings(
      season.championship.accumulatedStandings!.filter((row) => survivors.has(row.team.id))
    ).map((row) => season.nameOf(row.team));
    season.playToEnd();
  });

  it('plays 14 group rounds and five two-legged knockout phases to a champion', () => {
    expect(isPhasedChampionshipOver(season.championship)).toBe(true);
    expect(season.championship.matchContainer.rounds.map((round) => round.phaseIndex)).toEqual([
      ...Array(14).fill(0),
      1,
      1,
      2,
      2,
      3,
      3,
      4,
      4,
      5,
      5,
    ]);
    expect(season.championship.survivingTeamIds).toEqual([byName('independencia').id]);
  });

  it('pairs the 2ª Fase exactly as Anexo B does for the scripted group tables', () => {
    // Each group's table follows seed order: A-1 is Independência 1º, Humaitá 2º, Manaus 3º,
    // Manauara 4º; A-2 is Maracanã 1º, Iguatu 2º, Sampaio Corrêa 3º, Maranhão 4º; and so on.
    const groups = Array.from({ length: 8 }, (_, group) =>
      season.names.slice(group * 8, group * 8 + 4)
    );
    const expected: [string, string][] = [];
    for (let x = 0; x < 8; x += 2) {
      const [ax, ay] = [groups[x], groups[x + 1]];
      // B: 1ºx×4ºy, 2ºy×3ºx, 1ºy×4ºx, 2ºx×3ºy — the 1º/2º club hosts the second leg (Art. 21 §1).
      expected.push([ax[0], ay[3]], [ay[1], ax[2]], [ay[0], ax[3]], [ax[1], ay[2]]);
    }

    expect(season.ties(1)).toEqual(expected);
    expect(season.ties(1).slice(0, 4)).toEqual([
      ['independencia', 'maranhao'],
      ['iguatu', 'manaus'],
      ['maracana', 'manauara'],
      ['humaita', 'sampaio-correa'],
    ]);
  });

  it('crosses the 2ª Fase winners into the 3ª Fase as Anexo B does, not by adjacent ties', () => {
    const winners = season
      .ties(1)
      .map(([a, b]) => (season.names.indexOf(a) < season.names.indexOf(b) ? a : b));
    const crossings = [
      [0, 5],
      [1, 4],
      [2, 7],
      [3, 6],
      [8, 13],
      [9, 12],
      [10, 15],
      [11, 14],
    ];

    expect(season.ties(2).map((tie) => [...tie].sort())).toEqual(
      crossings.map(([a, b]) => [winners[a], winners[b]].sort())
    );
  });

  it('re-seeds the Quartas on accumulated points: 1×8, 4×5, 2×7, 3×6, better-ranked hosting', () => {
    const order = bracketSeedOrder(8);
    const expected: [string, string][] = [];
    for (let i = 0; i < 8; i += 2) {
      expected.push([
        accumulatedBeforeQuartas[order[i] - 1],
        accumulatedBeforeQuartas[order[i + 1] - 1],
      ]);
    }

    expect(season.ties(3)).toEqual(expected);
    // The re-seed matters here: tie order alone would pair the Quartas differently.
    expect(accumulatedBeforeQuartas).not.toEqual(thirdPhaseWinners);
  });

  it('keeps the Semifinal and Final in bracket order from the Quartas', () => {
    const winnerOf = ([a, b]: [string, string]) =>
      season.names.indexOf(a) < season.names.indexOf(b) ? a : b;
    const quartas = season.ties(3).map(winnerOf);
    const semis = season.ties(4);

    expect(semis.map((tie) => [...tie].sort())).toEqual([
      [quartas[0], quartas[1]].sort(),
      [quartas[2], quartas[3]].sort(),
    ]);
    expect(season.ties(5).flat().sort()).toEqual(semis.map(winnerOf).sort());
  });

  it('promotes its 4 semifinalists into Série C, which drops 4 back to keep D at 64', () => {
    const semifinalists = season.ties(4).flat();
    const next = season.rollOver();
    const serieC = teamIds(next.promotionChampionship);

    for (const name of semifinalists) expect(serieC.has(byName(name).id)).toBe(true);
    for (const name of semifinalists) {
      expect(teamIds(next.playableChampionship).has(byName(name).id)).toBe(false);
    }
    expect(next.playableChampionship.teams).toHaveLength(64);
    expect(next.promotionChampionship!.teams).toHaveLength(20);
    expect(next.relegationChampionship).toBeUndefined();
  });
});
