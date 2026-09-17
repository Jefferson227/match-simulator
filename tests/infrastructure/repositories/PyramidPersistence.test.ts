/**
 * MS-109: a game saved after a promoting roll-over reloads into the human's new division, with the
 * whole pyramid behind it.
 *
 * Replaces MS-107's re-centred container persistence test: the roll-over now moves only
 * `playableInternalName`, and that pointer is what has to survive the save. Played on the women's
 * pyramid; the men's D → C case is covered by `SavedGameSize.test.ts`.
 *
 * The whole-state equality below holds because a freshly rolled-over pyramid has no played rounds:
 * every fixture references the club exactly as `teams` holds it, so nothing is lost when the
 * reference is resolved by id. A container with played rounds has to be compared with
 * `expectEquivalent` instead — see `tests/support/savedGameEquivalence.ts`.
 */
import { beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import ChampionshipService from '../../../src/domain/services/ChampionshipService';
import ChampionshipContainer from '../../../src/domain/models/ChampionshipContainer';
import { getPlayableChampionship } from '../../../src/domain/features/pyramid/Pyramid';
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
  ChampionshipService.getTeamControlledByHuman(getPlayableChampionship(container)).getResult().id;

describe('a pyramid rolled over by a promotion survives save and load', () => {
  let rolledOver: ChampionshipContainer;

  beforeAll(() => {
    // Série A3, human on seed 0: wins every tie, so it is one of the four promoted semifinalists
    // and the pointer moves to A2.
    const season = new ScriptedSeason(A3);
    season.assignHuman(0);
    season.playToEnd();
    rolledOver = season.rollOver();

    expect(rolledOver.playableInternalName).toBe(A2);
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reloads with the human playing its new division', () => {
    GameRepository.saveGame(stateOf(rolledOver));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.playableInternalName).toBe(A2);

    const humanTeam = ChampionshipService.getTeamControlledByHuman(
      getPlayableChampionship(championshipContainer)
    );
    expect(humanTeam.succeeded).toBe(true);
    expect(humanTeam.getResult().id).toBe(humanIdOf(rolledOver));
  });

  it('keeps every division of the pyramid in tier order, fixtures included', () => {
    GameRepository.saveGame(stateOf(rolledOver));
    const { championshipContainer } = GameRepository.loadGame();

    expect(championshipContainer.championships.map((division) => division.internalName)).toEqual([
      A1,
      A2,
      A3,
    ]);
    championshipContainer.championships.forEach((division) =>
      expect(division.matchContainer.rounds.length).toBeGreaterThan(0)
    );
    expect(
      championshipContainer.championships.map((division) => division.hasTeamControlledByHuman)
    ).toEqual([false, true, false]);
  });

  it('round-trips the whole state unchanged', () => {
    const state = stateOf(rolledOver);
    GameRepository.saveGame(state);

    expect(GameRepository.loadGame()).toEqual(state);
  });

  it('round-trips the cups field when a container carries one', () => {
    const [a1] = rolledOver.championships;
    const state = stateOf({ ...rolledOver, cups: [a1] });
    GameRepository.saveGame(state);

    expect(GameRepository.loadGame().championshipContainer.cups).toEqual([a1]);
  });

  it('reloads into a division the human can be relegated out of again', () => {
    // The reloaded A2 carries the discriminants its own division declares, not the entry
    // division's — so next season the human can go either way.
    GameRepository.saveGame(stateOf(rolledOver));
    const playable = getPlayableChampionship(GameRepository.loadGame().championshipContainer);

    expect(playable.isPromotable).toBe(true);
    expect(playable.isRelegatable).toBe(true);
  });
});
