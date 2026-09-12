/**
 * MS-107: a game saved after a re-centred roll-over has to reload into the human's new division.
 *
 * `GameRepository` is plain `JSON.stringify` over `GameState`, so nothing here needs a migration —
 * but the container the roll-over now produces is a different shape from the one saved the season
 * before, and that is worth pinning.
 *
 * Played on the women's pyramid because the men's one does not fit in `localStorage` at all: a
 * played Série D season already serialises to ~5.1M code units and throws `QuotaExceededError`
 * before MS-107 changes anything. That is a pre-existing bug with its own follow-up —
 * `.plans/MS-107/docs/05-MS-107-localstorage-quota-finding.md`.
 */
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { GameState } from '../../../src/game-engine/GameState';
import { useUniqueTeamIds } from '../../support/seasonHarness';
import { ScriptedSeason } from '../../support/scriptedSeason';

beforeAll(useUniqueTeamIds);

const A1 = 'brasileirao-feminino-serie-a1';
const A2 = 'brasileirao-feminino-serie-a2';
const A3 = 'brasileirao-feminino-serie-a3';

const stateOf = (championshipContainer: ChampionshipContainer): GameState => ({
  championshipContainer,
  hasError: false,
  errorMessage: '',
  leagueType: 'womens',
  coachName: 'Tester',
  currentScreen: 'TeamManager',
  gameConfig: { clockSpeed: 250 },
});

const humanIdOf = (container: ChampionshipContainer) =>
  ChampionshipService.getTeamControlledByHuman(container.playableChampionship).getResult().id;

describe('a re-centred container survives save and load', () => {
  let recentred: ChampionshipContainer;

  beforeAll(() => {
    // Série A3, human on seed 0: wins every tie, so it is one of the four promoted semifinalists
    // and the container re-centres on A2.
    const season = new ScriptedSeason(A3);
    season.assignHuman(0);
    season.playToEnd();
    recentred = season.rollOver();

    expect(recentred.playableChampionship.internalName).toBe(A2);
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reloads with the human playing its new division', () => {
    GameRepository.saveGame(stateOf(recentred));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.playableChampionship.internalName).toBe(A2);

    const humanTeam = ChampionshipService.getTeamControlledByHuman(
      championshipContainer.playableChampionship
    );
    expect(humanTeam.succeeded).toBe(true);
    expect(humanTeam.getResult().id).toBe(humanIdOf(recentred));
  });

  it('keeps both neighbour slots, fixtures included', () => {
    GameRepository.saveGame(stateOf(recentred));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.promotionChampionship?.internalName).toBe(A1);
    expect(championshipContainer.relegationChampionship?.internalName).toBe(A3);
    expect(
      championshipContainer.promotionChampionship?.matchContainer.rounds.length
    ).toBeGreaterThan(0);
    expect(
      championshipContainer.relegationChampionship?.matchContainer.rounds.length
    ).toBeGreaterThan(0);
  });

  it('round-trips the whole state unchanged', () => {
    const state = stateOf(recentred);
    GameRepository.saveGame(state);

    expect(GameRepository.loadGame()).toEqual(state);
  });

  it('reloads into a division the human can be relegated out of again', () => {
    // The point of re-centring: the reloaded A2 carries the discriminants its own division declares,
    // not the entry division's — so next season the human can go either way.
    GameRepository.saveGame(stateOf(recentred));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.playableChampionship.isPromotable).toBe(true);
    expect(championshipContainer.playableChampionship.isRelegatable).toBe(true);
  });
});
