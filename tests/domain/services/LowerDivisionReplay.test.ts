import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../../src/domain/models/Championship';
import Match from '../../../src/domain/models/Match';
import { Team } from '../../../src/domain/models/Team';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';
import {
  groupsOfPhase,
  isPhasedChampionshipOver,
} from '../../../src/domain/features/phases/PhaseProgression';
import { bracketSeedOrder } from '../../../src/domain/features/fixture-generation/KnockoutBracket';
import { rankStandings } from '../../../src/domain/features/standings/StandingsComparator';
import championshipsJSON from '../../../src/infrastructure/data/championships.json';
import { useUniqueTeamIds } from '../../support/seasonHarness';

beforeAll(useUniqueTeamIds);

/** Deterministic, but varied enough that the AI neighbours' shootouts separate. */
function pinnedRng(): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      index += 1;
      return min + (((index * 7919 + 104729) % 10007) % (max - min + 1));
    },
  };
}

const teamNamesOf = (internalName: string) =>
  (championshipsJSON as { internalName: string; teamNames: string[] }[]).find(
    (entry) => entry.internalName === internalName
  )!.teamNames;

/**
 * A seeded division whose results are scripted by seed order: the club listed earlier in
 * `teamNames` wins every match 2-0. Every table and every tie is then known in advance.
 */
class ScriptedSeason {
  container: ChampionshipContainer;
  private readonly rng = pinnedRng();
  private readonly seedIndex = new Map<Team['id'], number>();
  readonly names: string[];

  constructor(internalName: string) {
    const result = ChampionshipService.initChampionships(internalName);
    if (!result.succeeded) throw new Error(result.error?.message);
    this.container = result.getResult();
    this.names = teamNamesOf(internalName);
    // The repository builds `teams` in `teamNames` order.
    this.container.playableChampionship.teams.forEach((team, index) =>
      this.seedIndex.set(team.id, index)
    );
  }

  get championship(): Championship {
    return this.container.playableChampionship;
  }

  nameOf(team: Team): string {
    return this.names[this.seedIndex.get(team.id)!];
  }

  private score(match: Match): [number, number] {
    return this.seedIndex.get(match.homeTeam.id)! < this.seedIndex.get(match.awayTeam.id)!
      ? [2, 0]
      : [0, 2];
  }

  playRound(): void {
    const started = ChampionshipService.startRoundForAllChampionships(this.container);
    if (!started.succeeded) throw new Error(started.error?.message);

    const playable = started.getResult().playableChampionship;
    const { currentRound } = playable.matchContainer;
    const rounds = playable.matchContainer.rounds.map((round) =>
      round.number !== currentRound
        ? round
        : {
            ...round,
            matches: round.matches.map((match) => {
              const [homeTeamScore, awayTeamScore] = this.score(match);
              return { ...match, homeTeamScore, awayTeamScore };
            }),
          }
    );

    const ended = ChampionshipService.endRoundForAllChampionships(
      {
        ...started.getResult(),
        playableChampionship: {
          ...playable,
          matchContainer: { ...playable.matchContainer, rounds },
        },
      },
      { rng: this.rng }
    );
    if (!ended.succeeded) throw new Error(ended.error?.message);
    this.container = ended.getResult();
  }

  playUntilPhase(phaseIndex: number): this {
    while ((this.championship.currentPhaseIndex ?? 0) < phaseIndex) this.playRound();
    return this;
  }

  playToEnd(): this {
    for (let guard = 0; guard < 100 && !isPhasedChampionshipOver(this.championship); guard++) {
      this.playRound();
    }
    return this;
  }

  /** Each tie of a knockout phase as `[second-leg host, first-leg host]` names, in tie order. */
  ties(phaseIndex: number): [string, string][] {
    return this.championship.matchContainer.rounds
      .filter((round) => round.phaseIndex === phaseIndex)
      .flatMap((round) => round.matches)
      .filter((match) => match.leg === 2)
      .map((match) => [this.nameOf(match.homeTeam), this.nameOf(match.awayTeam)]);
  }

  /** Group members of a round-robin phase, by name, in seed order. */
  groups(phaseIndex: number): string[][] {
    const groups: string[][] = [];
    for (const [teamId, group] of groupsOfPhase(
      this.championship.matchContainer.rounds,
      phaseIndex
    )) {
      (groups[group] ??= []).push(this.names[this.seedIndex.get(teamId as Team['id'])!]);
    }
    return groups.map((group) =>
      group.sort((a, b) => this.names.indexOf(a) - this.names.indexOf(b))
    );
  }

  rollOver(): ChampionshipContainer {
    const result = ChampionshipService.runEndOfChampionshipActions(this.container);
    if (!result.succeeded) throw new Error(result.error?.message);
    return result.getResult();
  }
}

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
