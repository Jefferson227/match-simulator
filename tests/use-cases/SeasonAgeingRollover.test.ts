/**
 * MS-113: the season roll-over ages the pyramid before it exchanges clubs and regenerates the
 * season, so the next season is played by the aged, replaced squads — including clubs that change
 * division, which the exchange reads off the tables rather than `championship.teams`.
 *
 * Runs the real services: nothing is mocked but the random provider.
 */
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import ChampionshipUseCases from '../../src/use-cases/ChampionshipUseCases';
import SeasonAgeingService from '../../src/domain/services/SeasonAgeingService';
import OperationResult from '../../src/domain/results/OperationResult';
import { GameState } from '../../src/game-engine/GameState';
import ChampionshipContainer from '../../src/domain/models/ChampionshipContainer';
import { Team } from '../../src/domain/models/Team';
import { RandomProvider } from '../../src/domain/features/match-simulation/types';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../src/domain/features/pyramid/Pyramid';
import { finishAll, init, useUniqueTeamIds } from '../support/seasonHarness';

beforeAll(useUniqueTeamIds);

const C = 'brasileirao-serie-c';
const D = 'brasileirao-serie-d';

/** Every percentage roll succeeds, so every player and AI coach retires; other draws take the minimum. */
const everyoneRetires: RandomProvider = {
  nextInt: (min, max) => (min === 0 && max === 1000 ? 0 : min),
};

function stateOf(championshipContainer: ChampionshipContainer): GameState {
  return {
    championshipContainer,
    hasError: false,
    errorMessage: '',
    currentScreen: 'SeasonSummary',
    gameConfig: { clockSpeed: 250 },
    leagueType: 'mens',
    coachName: 'Tester',
    coachPool: [],
    retiredPlayers: [],
    retiredCoaches: [],
  };
}

/** Série D's pyramid with the human on the club at `seedIndex` of Série D. */
function mensPyramid(seedIndex: number): ChampionshipContainer {
  const container = init(D);
  const serieD = getPlayableChampionship(container);
  return {
    ...container,
    championships: container.championships.map((championship) =>
      championship.internalName !== D
        ? championship
        : {
            ...championship,
            teams: serieD.teams.map((team, index) =>
              index === seedIndex ? { ...team, isControlledByHuman: true } : team
            ),
          }
    ),
  };
}

const allTeams = (container: ChampionshipContainer): Team[] =>
  container.championships.flatMap((championship) => championship.teams);

const originalPlayerIds = (container: ChampionshipContainer): Set<string> =>
  new Set(allTeams(container).flatMap((team) => team.players.map((player) => player.id)));

describe('ChampionshipUseCases.runEndOfChampionshipActions — season ageing', () => {
  let finished: ChampionshipContainer;
  let before: Set<string>;
  let next: GameState;

  beforeAll(() => {
    finished = finishAll(mensPyramid(0));
    before = originalPlayerIds(finished);
    next = new ChampionshipUseCases(stateOf(finished)).runEndOfChampionshipActions({
      rng: everyoneRetires,
    });
  });

  it('rolls the season over without error', () => {
    expect(next.hasError).toBe(false);
    const season = getPlayableChampionship(finished).matchContainer.currentSeason;
    expect(getPlayableChampionship(next.championshipContainer).matchContainer.currentSeason).toBe(
      season + 1
    );
  });

  it('leaves no retired player in any club, including the clubs that changed division', () => {
    const survivors = allTeams(next.championshipContainer)
      .flatMap((team) => team.players)
      .filter((player) => before.has(player.id));
    expect(survivors).toEqual([]);
  });

  it('keeps every club’s squad size through the exchange', () => {
    const sizeById = new Map(allTeams(finished).map((team) => [team.id, team.players.length]));
    for (const team of allTeams(next.championshipContainer)) {
      expect(team.players.length).toBe(sizeById.get(team.id));
    }
  });

  it('builds the new season’s tables and fixtures from the aged squads', () => {
    for (const division of next.championshipContainer.championships) {
      const teamsById = new Map(division.teams.map((team) => [team.id, team]));
      for (const standing of division.standings) {
        expect(standing.team).toEqual(teamsById.get(standing.team.id));
      }
      for (const match of division.matchContainer.rounds.flatMap((round) => round.matches)) {
        for (const side of [match.homeTeam, match.awayTeam]) {
          expect(side.players.some((player) => before.has(player.id))).toBe(false);
        }
      }
    }
  });

  it('records every retiree and reports the human club’s', () => {
    expect(next.retiredPlayers).toHaveLength(before.size);
    const human = getPlayableChampionship(finished).teams[0];
    expect(next.lastSeasonRetirements?.teamId).toBe(human.id);
    expect(next.lastSeasonRetirements?.entries).toHaveLength(human.players.length);
    // Every retiree also took up coaching: every percentage roll succeeded.
    expect(next.coachPool).toHaveLength(before.size);
  });

  it('keeps the human club’s replaced squad in whichever division it plays next', () => {
    const human = allTeams(next.championshipContainer).find((team) => team.isControlledByHuman)!;
    expect(next.championshipContainer.playableInternalName).toBe(
      getChampionshipByInternalName(next.championshipContainer, C)?.teams.some(
        (team) => team.id === human.id
      )
        ? C
        : D
    );
    expect(human.players.map((player) => player.id)).toEqual(
      next.lastSeasonRetirements?.entries.map((entry) => entry.replacement.id)
    );
  });

  it('does nothing before the season is over', () => {
    const running = mensPyramid(0);
    const state = stateOf(running);
    const unchanged = new ChampionshipUseCases(state).runEndOfChampionshipActions({
      rng: everyoneRetires,
    });

    expect(unchanged.hasError).toBe(false);
    expect(unchanged.retiredPlayers).toEqual([]);
    expect(unchanged.lastSeasonRetirements).toBeUndefined();
    expect(originalPlayerIds(unchanged.championshipContainer)).toEqual(originalPlayerIds(running));
  });

  it('returns error state when ageing fails, leaving the season unrolled', () => {
    const failure = new OperationResult({} as never);
    failure.setError({ errorCode: 'exception', message: 'Ageing failed' });
    const spy = jest.spyOn(SeasonAgeingService, 'runSeasonAgeing').mockReturnValue(failure);

    const state = stateOf(finished);
    const failed = new ChampionshipUseCases(state).runEndOfChampionshipActions();

    expect(failed.hasError).toBe(true);
    expect(failed.errorMessage).toBe('Ageing failed');
    expect(failed.championshipContainer).toBe(finished);
    spy.mockRestore();
  });
});
