/**
 * Plays a seeded division through `ChampionshipService` with scripted results: the club listed earlier
 * in the seed's `teamNames` wins every match 2-0, so every table and every tie is known in advance.
 * The AI divisions are played by the service itself, each under its own pinned stream
 * (`pinnedRngByDivision`).
 *
 * Not a test file — `tests/support` is outside Jest's `*.test.ts` pattern. Build seeded containers in
 * `beforeAll`, after `useUniqueTeamIds`: at collection time every club id is the stubbed 'mocked-uuid'.
 */
import ChampionshipService from '../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Championship } from '../../src/domain/models/Championship';
import Match from '../../src/domain/models/Match';
import { Team } from '../../src/domain/models/Team';
import { RandomProvider } from '../../src/domain/features/match-simulation/types';
import {
  groupsOfPhase,
  isPhasedChampionshipOver,
} from '../../src/domain/features/phases/PhaseProgression';
import championshipsJSON from '../../src/infrastructure/data/championships.json';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
  replaceChampionship,
  updatePlayableChampionship,
} from '../../src/domain/features/pyramid/Pyramid';

/** Deterministic, but varied enough that the AI neighbours' shootouts separate. */
export function pinnedRng(): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      index += 1;
      return min + (((index * 7919 + 104729) % 10007) % (max - min + 1));
    },
  };
}

/** A stable, non-negative seed for `text`. */
function seedOf(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) % 10007;
  }
  return hash;
}

/**
 * One deterministic stream per division, in the style of `pinnedRng`, offset by a seed derived from
 * the division's `internalName`. Memoised: asking for a division twice returns the same stream, so
 * its draws continue rather than restart. A fresh factory restarts every stream.
 *
 * Pass as `rngForDivision`, so an AI division's results depend only on how many draws *it* has made.
 */
export function pinnedRngByDivision(): (internalName: string) => RandomProvider {
  const streams = new Map<string, RandomProvider>();

  return (internalName) => {
    let stream = streams.get(internalName);
    if (!stream) {
      const seed = seedOf(internalName);
      let index = 0;
      stream = {
        nextInt: (min: number, max: number) => {
          index += 1;
          return min + (((index * 7919 + 104729 + seed) % 10007) % (max - min + 1));
        },
      };
      streams.set(internalName, stream);
    }
    return stream;
  };
}

export const teamNamesOf = (internalName: string) =>
  (championshipsJSON as { internalName: string; teamNames: string[] }[]).find(
    (entry) => entry.internalName === internalName
  )!.teamNames;

/**
 * A seeded division whose results are scripted by seed order: the club listed earlier in
 * `teamNames` wins every match 2-0. Every table and every tie is then known in advance.
 */
export class ScriptedSeason {
  container: ChampionshipContainer;
  private readonly rng = pinnedRng();
  private readonly rngForDivision = pinnedRngByDivision();
  private readonly seedIndex = new Map<Team['id'], number>();
  private humanFate?: 'wins' | 'loses';
  private results?: (home: string, away: string, phaseIndex: number) => [number, number];
  readonly names: string[];

  constructor(internalName: string) {
    const result = ChampionshipService.initChampionships(internalName);
    if (!result.succeeded) throw new Error(result.error?.message);
    this.container = result.getResult();
    this.names = teamNamesOf(internalName);
    // The repository builds `teams` in `teamNames` order.
    getPlayableChampionship(this.container).teams.forEach((team, index) =>
      this.seedIndex.set(team.id, index)
    );
  }

  /**
   * Hands the club at `seedIndex` of the playable division to the human player.
   *
   * The flag has to be stamped on every reference to that club — `teams`, `standings` and the
   * fixtures — because the roll-over picks promoted and relegated clubs off the standings, not off
   * `teams`. Call it before any round is played.
   */
  assignHuman(seedIndex: number): this {
    const targetId = this.championship.teams[seedIndex].id;
    const mark = (team: Team): Team =>
      team.id === targetId ? { ...team, isControlledByHuman: true } : team;

    this.container = updatePlayableChampionship(this.container, (championship) => ({
      ...championship,
      hasTeamControlledByHuman: true,
      teams: championship.teams.map(mark),
      standings: championship.standings.map((standing) => ({
        ...standing,
        team: mark(standing.team),
      })),
      matchContainer: {
        ...championship.matchContainer,
        rounds: championship.matchContainer.rounds.map((round) => ({
          ...round,
          matches: round.matches.map((match) => ({
            ...match,
            homeTeam: mark(match.homeTeam),
            awayTeam: mark(match.awayTeam),
          })),
        })),
      },
    }));

    return this;
  }

  /**
   * Scripts the human's club to win (or lose) every match 2-0, whatever the seed order says — so it
   * is promoted (or relegated) from any division it plays in, season after season.
   */
  humanAlways(fate: 'wins' | 'loses'): this {
    this.humanFate = fate;
    return this;
  }

  /**
   * Scores the playable division's matches with `results` instead of seed order — a real season's
   * results, looked up by the clubs' seed names.
   */
  withResults(results: (home: string, away: string, phaseIndex: number) => [number, number]): this {
    this.results = results;
    return this;
  }

  get championship(): Championship {
    return getPlayableChampionship(this.container);
  }

  /** Any division of the pyramid, by `internalName`. */
  division(internalName: string): Championship {
    const division = getChampionshipByInternalName(this.container, internalName);
    if (!division) throw new Error(`No division ${internalName} in the pyramid.`);
    return division;
  }

  nameOf(team: Team): string {
    return this.names[this.seedIndex.get(team.id)!];
  }

  /** Earlier seed wins; a club that joined after the seed is ordered by id instead. */
  private score(match: Match, phaseIndex: number): [number, number] {
    if (this.results) {
      return this.results(this.nameOf(match.homeTeam), this.nameOf(match.awayTeam), phaseIndex);
    }

    if (
      this.humanFate &&
      (match.homeTeam.isControlledByHuman || match.awayTeam.isControlledByHuman)
    ) {
      const humanWins = match.homeTeam.isControlledByHuman === (this.humanFate === 'wins');
      return humanWins ? [2, 0] : [0, 2];
    }

    const home = this.seedIndex.get(match.homeTeam.id);
    const away = this.seedIndex.get(match.awayTeam.id);
    const homeWins =
      home !== undefined && away !== undefined
        ? home < away
        : match.homeTeam.id < match.awayTeam.id;
    return homeWins ? [2, 0] : [0, 2];
  }

  playRound(): void {
    const started = ChampionshipService.startRoundForAllChampionships(this.container);
    if (!started.succeeded) throw new Error(started.error?.message);

    const playable = getPlayableChampionship(started.getResult());
    const { currentRound } = playable.matchContainer;
    const rounds = playable.matchContainer.rounds.map((round) =>
      round.number !== currentRound
        ? round
        : {
            ...round,
            matches: round.matches.map((match) => {
              const [homeTeamScore, awayTeamScore] = this.score(match, round.phaseIndex ?? 0);
              return { ...match, homeTeamScore, awayTeamScore };
            }),
          }
    );

    const ended = ChampionshipService.endRoundForAllChampionships(
      replaceChampionship(started.getResult(), {
        ...playable,
        matchContainer: { ...playable.matchContainer, rounds },
      }),
      { rng: this.rng, rngForDivision: this.rngForDivision }
    );
    if (!ended.succeeded) throw new Error(ended.error?.message);
    this.container = ended.getResult();
  }

  playUntilPhase(phaseIndex: number): this {
    while ((this.championship.currentPhaseIndex ?? 0) < phaseIndex) this.playRound();
    return this;
  }

  /** Plays every round the playable division has left — phased or not. */
  playToEnd(): this {
    for (let guard = 0; guard < 100 && this.hasRoundToPlay(); guard++) this.playRound();
    return this;
  }

  private hasRoundToPlay(): boolean {
    if (isPhasedChampionshipOver(this.championship)) return false;
    const { currentRound, rounds } = this.championship.matchContainer;
    return rounds.some((round) => round.number === currentRound);
  }

  /** Each tie of a knockout phase as `[second-leg host, first-leg host]` names, in tie order. */
  ties(phaseIndex: number): [string, string][] {
    return this.secondLegs(phaseIndex, (match) => match.bracket !== 'playoff');
  }

  /** The ties of the playoff played alongside a knockout phase, as `ties` gives them. */
  playoffTies(phaseIndex: number): [string, string][] {
    return this.secondLegs(phaseIndex, (match) => match.bracket === 'playoff');
  }

  private secondLegs(phaseIndex: number, keep: (match: Match) => boolean): [string, string][] {
    return this.championship.matchContainer.rounds
      .filter((round) => round.phaseIndex === phaseIndex)
      .flatMap((round) => round.matches)
      .filter((match) => match.leg === 2 && keep(match))
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

  /** Runs the end-of-season exchange and returns the next season's container, leaving this one. */
  rollOver(): ChampionshipContainer {
    const result = ChampionshipService.runEndOfChampionshipActions(this.container);
    if (!result.succeeded) throw new Error(result.error?.message);
    return result.getResult();
  }

  /** Plays the whole season, rolls it over and carries on in the next season. */
  playSeasonAndRollOver(): ChampionshipContainer {
    this.playToEnd();
    this.container = this.rollOver();
    return this.container;
  }
}
