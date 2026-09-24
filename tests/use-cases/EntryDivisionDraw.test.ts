import { beforeAll, describe, expect, it } from '@jest/globals';
import ChampionshipUseCases from '../../src/use-cases/ChampionshipUseCases';
import { GameState } from '../../src/game-engine/GameState';
import { createInitialGameState } from '../../src/game-engine/initialGameState';
import LeagueType from '../../src/domain/enums/LeagueType';
import { useUniqueTeamIds } from '../support/seasonHarness';
import { pinnedRng } from '../support/scriptedSeason';
import { getPlayableChampionship } from '../../src/domain/features/pyramid/Pyramid';

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
    clubs: 96,
    pyramid: [
      'brasileirao-serie-a',
      'brasileirao-serie-b',
      'brasileirao-serie-c',
      'brasileirao-serie-d',
    ],
  },
  {
    leagueType: 'womens' as LeagueType,
    entry: 'brasileirao-feminino-serie-a3',
    clubs: 32,
    pyramid: [
      'brasileirao-feminino-serie-a1',
      'brasileirao-feminino-serie-a2',
      'brasileirao-feminino-serie-a3',
    ],
  },
])('a new $leagueType game drawn from the seed', ({ leagueType, entry, clubs, pyramid }) => {
  let state: GameState;

  beforeAll(() => {
    state = newGame(leagueType);
  });

  it(`starts in ${entry}`, () => {
    expect(state.hasError).toBe(false);
    expect(getPlayableChampionship(state.championshipContainer).internalName).toBe(entry);
    expect(getPlayableChampionship(state.championshipContainer).teams).toHaveLength(clubs);
  });

  it(`hands exactly one of the ${clubs} clubs to the human`, () => {
    const humanClubs = getPlayableChampionship(state.championshipContainer).teams.filter(
      (team) => team.isControlledByHuman
    );

    expect(humanClubs).toHaveLength(1);
  });

  it('draws the club the pinned rng picks, so the draw is deterministic', () => {
    const teams = getPlayableChampionship(state.championshipContainer).teams;
    const expectedIndex = pinnedRng().nextInt(0, clubs - 1);

    expect(teams.findIndex((team) => team.isControlledByHuman)).toBe(expectedIndex);
    expect(
      getPlayableChampionship(newGame(leagueType).championshipContainer).teams.findIndex(
        (team) => team.isControlledByHuman
      )
    ).toBe(expectedIndex);
  });

  it('reads the drawn club back through getTeamControlledByHuman', () => {
    const playable = getPlayableChampionship(state.championshipContainer);
    const drawn = new ChampionshipUseCases(state).getTeamControlledByHuman(playable);

    expect(drawn.isControlledByHuman).toBe(true);
    expect(playable.teams).toContainEqual(drawn);
  });

  it(`carries the whole ${leagueType} pyramid with ${entry} at the bottom`, () => {
    const names = state.championshipContainer.championships.map(
      (championship) => championship.internalName
    );

    expect(names).toEqual(pyramid);
    expect(state.championshipContainer.playableInternalName).toBe(entry);
  });

  it('leaves every AI division club under AI control', () => {
    const aiClubs = state.championshipContainer.championships
      .filter((championship) => championship.internalName !== entry)
      .flatMap((championship) => championship.teams);

    expect(aiClubs.length).toBeGreaterThan(0);
    expect(aiClubs.some((team) => team.isControlledByHuman)).toBe(false);
  });
});
