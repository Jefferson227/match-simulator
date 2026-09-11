import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipUseCases from '../../src/use-cases/ChampionshipUseCases';
import { GameState } from '../../src/game-engine/GameState';
import { createInitialGameState } from '../../src/game-engine/initialGameState';
import LeagueType from '../../src/domain/enums/LeagueType';
import { useUniqueTeamIds } from '../support/seasonHarness';
import { pinnedRng } from '../support/scriptedSeason';

// Without unique ids every club is 'mocked-uuid', and flagging one flags them all.
beforeAll(useUniqueTeamIds);

const newGame = (leagueType: LeagueType): GameState =>
  new ChampionshipUseCases({
    ...createInitialGameState(),
    hasError: false,
    errorMessage: '',
    leagueType,
  } as GameState).drawTeamForHumanPlayer({ rng: pinnedRng() });

describe.each([
  {
    leagueType: 'mens' as LeagueType,
    entry: 'brasileirao-serie-d',
    clubs: 64,
    promotion: 'brasileirao-serie-c',
  },
  {
    leagueType: 'womens' as LeagueType,
    entry: 'brasileirao-feminino-serie-a3',
    clubs: 32,
    promotion: 'brasileirao-feminino-serie-a2',
  },
])('a new $leagueType game drawn from the seed', ({ leagueType, entry, clubs, promotion }) => {
  let state: GameState;

  beforeAll(() => {
    state = newGame(leagueType);
  });

  it(`starts in ${entry}`, () => {
    expect(state.hasError).toBe(false);
    expect(state.championshipContainer.playableChampionship.internalName).toBe(entry);
    expect(state.championshipContainer.playableChampionship.teams).toHaveLength(clubs);
  });

  it(`hands exactly one of the ${clubs} clubs to the human`, () => {
    const humanClubs = state.championshipContainer.playableChampionship.teams.filter(
      (team) => team.isControlledByHuman
    );

    expect(humanClubs).toHaveLength(1);
  });

  it('draws the club the pinned rng picks, so the draw is deterministic', () => {
    const teams = state.championshipContainer.playableChampionship.teams;
    const expectedIndex = pinnedRng().nextInt(0, clubs - 1);

    expect(teams.findIndex((team) => team.isControlledByHuman)).toBe(expectedIndex);
    expect(
      newGame(leagueType).championshipContainer.playableChampionship.teams.findIndex(
        (team) => team.isControlledByHuman
      )
    ).toBe(expectedIndex);
  });

  it('reads the drawn club back through getTeamControlledByHuman', () => {
    const playable = state.championshipContainer.playableChampionship;
    const drawn = new ChampionshipUseCases(state).getTeamControlledByHuman(playable);

    expect(drawn.isControlledByHuman).toBe(true);
    expect(playable.teams).toContainEqual(drawn);
  });

  it(`carries ${promotion} as the promotion neighbour and no relegation neighbour`, () => {
    expect(state.championshipContainer.promotionChampionship?.internalName).toBe(promotion);
    expect(state.championshipContainer.relegationChampionship).toBeUndefined();
  });

  it('leaves every AI neighbour club under AI control', () => {
    expect(
      state.championshipContainer.promotionChampionship?.teams.some(
        (team) => team.isControlledByHuman
      )
    ).toBe(false);
  });
});
