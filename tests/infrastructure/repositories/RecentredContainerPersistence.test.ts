/**
 * MS-107: a game saved after a re-centred roll-over has to reload into the human's new division.
 *
 * The container the roll-over produces is a different shape from the one saved the season before,
 * and that is worth pinning.
 *
 * Played on the women's pyramid because when this was written the men's one did not fit in
 * `localStorage` at all. MS-108 dehydrated the save and the men's D → C case is now covered by
 * `SavedGameSize.test.ts`; this file stays as the women's half of that pair.
 *
 * The whole-state equality below still holds after MS-108 because a freshly rolled-over container
 * has no played rounds: every fixture references the club exactly as `teams` holds it, so nothing
 * is lost when the reference is resolved by id. A container with played rounds has to be compared
 * with `expectEquivalent` instead — see `tests/support/savedGameEquivalence.ts`.
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
