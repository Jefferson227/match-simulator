/**
 * Plays a seeded division through `ChampionshipService` with scripted results: the club listed earlier
 * in the seed's `teamNames` wins every match 2-0, so every table and every tie is known in advance.
 * The AI neighbours are caught up by the service itself, under a pinned rng.
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

  /** Earlier seed wins; a club that joined after the seed is ordered by id instead. */
  private score(match: Match): [number, number] {
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
