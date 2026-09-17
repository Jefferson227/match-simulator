/**
 * MS-108: what a dehydrated save drops has to be provably rebuildable.
 *
 * A save no longer stores the *historical snapshot* a played fixture carries — the clubs' morale
 * and their players' xp / strength / isStarter / isSub as they stood that round. The claim is that
 * nothing reads those: `TeamStatsService` reads `match.homeTeam.id` and the scores, and the screens
 * render the current round. If the claim is wrong, a reloaded game plays forward differently from
 * one that was never saved.
 *
 * So this plays the *same next round* on both, under the same pinned rng, and demands the same
 * fixtures, the same scores and the same standings.
 */
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import { Championship } from '../../../src/domain/models/Championship';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import Standing from '../../../src/domain/models/Standing';
import { Team } from '../../../src/domain/models/Team';
import { GameState } from '../../../src/game-engine/GameState';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason, pinnedRng, pinnedRngByDivision } from '../../support/scriptedSeason';
import {
  getPlayableChampionship,
  replaceChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';

beforeAll(useUniqueTeamIds);

const ROUNDS_BEFORE_SAVE = 5;

let season: ScriptedSeason;
let midSeason: GameState;

const stateOf = (championshipContainer: ChampionshipContainer): GameState => ({
  championshipContainer,
  hasError: false,
  errorMessage: '',
  leagueType: 'mens',
  coachName: 'Tester',
  currentScreen: 'TeamManager',
  gameConfig: { clockSpeed: 250 },
});

/** Seed position of a club, which is what decides a scripted result. */
const seedOf = (team: Team) => season.names.indexOf(season.nameOf(team));

/**
 * One more round, scripted exactly as `ScriptedSeason` scripts one — but driven here so both sides
 * get **freshly pinned** streams rather than sharing the harness's, which have already advanced.
 */
function playOneMoreRound(state: GameState): ChampionshipContainer {
  const rng = pinnedRng();
  const rngForDivision = pinnedRngByDivision();

  const started = ChampionshipService.startRoundForAllChampionships(state.championshipContainer);
  if (!started.succeeded) throw new Error(started.error?.message);

  const playable = getPlayableChampionship(started.getResult());
  const { currentRound } = playable.matchContainer;
  const rounds = playable.matchContainer.rounds.map((round) =>
    round.number !== currentRound
      ? round
      : {
          ...round,
          matches: round.matches.map((match) => {
            const homeWins = seedOf(match.homeTeam) < seedOf(match.awayTeam);
            return {
              ...match,
              homeTeamScore: homeWins ? 2 : 0,
              awayTeamScore: homeWins ? 0 : 2,
            };
          }),
        }
  );

  const ended = ChampionshipService.endRoundForAllChampionships(
    replaceChampionship(started.getResult(), {
      ...playable,
      matchContainer: { ...playable.matchContainer, rounds },
    }),
    { rng, rngForDivision }
  );
  if (!ended.succeeded) throw new Error(ended.error?.message);
  return ended.getResult();
}

/** Fixtures and results by club name, so two containers can be compared without sharing ids. */
const fixturesOf = (championship: Championship) =>
  championship.matchContainer.rounds.map((round) => ({
    number: round.number,
    status: round.status,
    matches: round.matches.map((match) => ({
      home: season.nameOf(match.homeTeam),
      away: season.nameOf(match.awayTeam),
      score: `${match.homeTeamScore}-${match.awayTeamScore}`,
      scorers: match.scorers.map((scorer) => `${scorer.player.name} ${scorer.time}`),
    })),
  }));

const tableOf = (standings: Standing[]) =>
  standings.map((standing) => ({
    position: standing.position,
    team: season.nameOf(standing.team),
    points: standing.points,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
  }));

const everyChampionship = (container: ChampionshipContainer) => container.championships;

describe('a reloaded game plays forward exactly as an unsaved one', () => {
  let fromMemory: ChampionshipContainer;
  let fromDisk: ChampionshipContainer;

  beforeAll(() => {
    // Série D: the container that did not fit before MS-108, stopped part-way through the season.
    season = new ScriptedSeason('brasileirao-serie-d');
    season.assignHuman(0);
    for (let round = 0; round < ROUNDS_BEFORE_SAVE; round += 1) season.playRound();
    midSeason = stateOf(season.container);

    window.localStorage.clear();
    GameRepository.saveGame(midSeason);
    const reloaded = GameRepository.loadGame();

    fromMemory = playOneMoreRound(midSeason);
    fromDisk = playOneMoreRound(reloaded);
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('was stopped mid-season with rounds already played', () => {
    const played = getPlayableChampionship(
      midSeason.championshipContainer
    ).matchContainer.rounds.filter((round) => round.status === 'ended');

    expect(played.length).toBe(ROUNDS_BEFORE_SAVE);
    expect(played.flatMap((round) => round.matches).length).toBeGreaterThan(0);
  });

  it('produces the same fixtures in the playable division', () => {
    expect(fixturesOf(getPlayableChampionship(fromDisk))).toEqual(
      fixturesOf(getPlayableChampionship(fromMemory))
    );
  });

  it('produces the same fixtures in every division of the pyramid', () => {
    expect(everyChampionship(fromDisk).map((c) => c.internalName)).toEqual(
      everyChampionship(fromMemory).map((c) => c.internalName)
    );
    everyChampionship(fromDisk).forEach((championship, index) => {
      expect(fixturesOf(championship)).toEqual(fixturesOf(everyChampionship(fromMemory)[index]));
    });
  });

  it('produces the same scores in the round just played', () => {
    const scoresOf = (container: ChampionshipContainer) => {
      const { rounds, currentRound } = getPlayableChampionship(container).matchContainer;
      return rounds
        .filter((round) => round.number === currentRound - 1)
        .flatMap((round) => round.matches)
        .map((match) => `${match.homeTeamScore}-${match.awayTeamScore}`);
    };

    expect(scoresOf(fromDisk)).toEqual(scoresOf(fromMemory));
    expect(scoresOf(fromDisk).length).toBeGreaterThan(0);
  });

  it('produces the same standings', () => {
    expect(tableOf(getPlayableChampionship(fromDisk).standings)).toEqual(
      tableOf(getPlayableChampionship(fromMemory).standings)
    );
    everyChampionship(fromDisk).forEach((championship, index) => {
      expect(tableOf(championship.standings)).toEqual(
        tableOf(everyChampionship(fromMemory)[index].standings)
      );
    });
  });

  it('advances the clock identically', () => {
    everyChampionship(fromDisk).forEach((championship, index) => {
      const counterpart = everyChampionship(fromMemory)[index];
      expect(championship.matchContainer.currentRound).toBe(
        counterpart.matchContainer.currentRound
      );
      expect(championship.currentPhaseIndex).toBe(counterpart.currentPhaseIndex);
      expect(championship.survivingTeamIds?.length).toBe(counterpart.survivingTeamIds?.length);
    });
  });
});
