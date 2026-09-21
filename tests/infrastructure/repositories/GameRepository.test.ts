import { beforeEach, describe, expect, it } from '@jest/globals';
import GameRepository from '../../../src/infrastructure/repositories/GameRepository';
import GameStateMapper from '../../../src/infrastructure/mappers/GameStateMapper';
import { GameState } from '../../../src/game-engine/GameState';
import { Championship } from '../../../src/domain/models/Championship';
import Match from '../../../src/domain/models/Match';
import Player from '../../../src/domain/models/Player';
import Standing from '../../../src/domain/models/Standing';
import { Team } from '../../../src/domain/models/Team';
import { currentRoundMatches, expectEquivalent } from '../../support/savedGameEquivalence';
import { containerOf } from '../../support/containerOf';
import { getPlayableChampionship } from '../../../src/domain/features/pyramid/Pyramid';

const STORAGE_KEY = 'match-simulator-game-state-v2';
const LEGACY_STORAGE_KEY = 'match-simulator-game-state';

function buildState(): GameState {
  return {
    championshipContainer: containerOf({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Mock Championship',
      internalName: 'mock-championship',
      numberOfTeams: 0,
      teams: [],
      standings: [],
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 1,
        totalRounds: 0,
        rounds: [],
      },
      type: 'double-round-robin',
      leagueType: 'mens',
      hasTeamControlledByHuman: false,
      isPromotable: false,
      isRelegatable: false,
    } as Championship),
    hasError: false,
    errorMessage: '',
    leagueType: 'mens',
    coachName: '',
    currentScreen: 'TeamManager',
    gameConfig: {
      clockSpeed: 1000,
    },
  };
}

const uuid = (seed: string): Team['id'] =>
  `${seed.padEnd(8, '0')}-0000-0000-0000-000000000000` as Team['id'];

const playerOf = (teamSeed: string, index: number): Player => ({
  id: uuid(`p${teamSeed}${index}`) as Player['id'],
  position: index === 0 ? 'GK' : 'FW',
  name: `Player ${teamSeed}-${index}`,
  strength: 60 + index,
  age: 26,
  xp: index,
  isStarter: index < 2,
  isSub: index >= 2,
});

const teamOf = (seed: string): Team => ({
  id: uuid(seed),
  fullName: `Club ${seed}`,
  shortName: `C${seed}`,
  abbreviation: seed.slice(0, 3).toUpperCase(),
  colors: { outline: '#000', background: '#fff', text: '#000' },
  players: [0, 1, 2].map((index) => playerOf(seed, index)),
  morale: 80,
  isControlledByHuman: seed === 'home',
});

const standingOf = (team: Team, position: number): Standing => ({
  team,
  position,
  wins: 1,
  draws: 0,
  losses: 0,
  goalsFor: 2,
  goalsAgainst: 1,
  points: 3,
});

/**
 * A container with something to lose: a played round whose fixtures hold a stale snapshot of both
 * clubs, and a current round that must survive byte-identically.
 */
function buildPlayedState(): GameState {
  const home = teamOf('home');
  const away = teamOf('away');
  const stale = (team: Team): Team => ({
    ...team,
    morale: 5,
    players: team.players.map((player) => ({ ...player, xp: 0, strength: 1 })),
  });

  const match = (id: string, homeTeam: Team, awayTeam: Team, played: boolean): Match => ({
    id: uuid(id),
    homeTeam,
    homeTeamScore: played ? 2 : 0,
    awayTeamScore: played ? 1 : 0,
    awayTeam,
    scorers: played ? [{ player: homeTeam.players[2], scorerTeam: 'home', time: 30 }] : [],
  });

  return {
    ...buildState(),
    championshipContainer: containerOf({
      ...getPlayableChampionship(buildState().championshipContainer),
      numberOfTeams: 2,
      teams: [home, away],
      standings: [standingOf(home, 1), standingOf(away, 2)],
      hasTeamControlledByHuman: true,
      matchContainer: {
        timer: 0,
        currentSeason: 2026,
        currentRound: 2,
        totalRounds: 2,
        rounds: [
          {
            id: uuid('r1'),
            number: 1,
            status: 'ended',
            matches: [match('m1', stale(home), stale(away), true)],
          },
          {
            id: uuid('r2'),
            number: 2,
            status: 'not-started',
            matches: [match('m2', away, home, false)],
          },
        ],
      },
    } as Championship),
  };
}

describe('GameRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and loads the game state from local storage', () => {
    const state = buildState();

    GameRepository.saveGame(state);

    expect(GameRepository.loadGame()).toEqual(state);
  });

  it('throws when no saved game exists', () => {
    expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
  });

  it('writes under the versioned key, not the pre-MS-108 one', () => {
    GameRepository.saveGame(buildState());

    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it('persists the dehydrated shape rather than the in-memory one', () => {
    GameRepository.saveGame(buildPlayedState());

    const raw = window.localStorage.getItem(STORAGE_KEY)!;
    const parsed = JSON.parse(raw);

    expect(parsed.saveVersion).toBe(3);
    expect(parsed.championshipContainer.playableInternalName).toBe('mock-championship');
    expect(
      getPlayableChampionship(parsed.championshipContainer).matchContainer.rounds[0].matches[0]
    ).toMatchObject({ homeTeamId: uuid('home'), awayTeamId: uuid('away') });
    expect(
      getPlayableChampionship(parsed.championshipContainer).matchContainer.rounds[0].matches[0]
        .homeTeam
    ).toBeUndefined();
  });

  it('round-trips a played container under the equivalence rule', () => {
    const state = buildPlayedState();

    GameRepository.saveGame(state);

    expectEquivalent(GameRepository.loadGame(), state);
  });

  it('brings the current round back byte-identical', () => {
    const state = buildPlayedState();
    const before = currentRoundMatches(getPlayableChampionship(state.championshipContainer));

    GameRepository.saveGame(state);
    const after = currentRoundMatches(
      getPlayableChampionship(GameRepository.loadGame().championshipContainer)
    );

    expect(after).toEqual(before);
  });

  describe('pre-MS-108 saves', () => {
    it('reports a save under the old key as no saved game', () => {
      window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(buildPlayedState()));

      expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
    });

    it('removes the old key rather than leaving it to rot in the quota', () => {
      window.localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(buildPlayedState()));

      expect(GameRepository.hasSavedGame()).toBe(false);
      expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });

    it('keeps a v2 save while clearing the old key beside it', () => {
      GameRepository.saveGame(buildPlayedState());
      window.localStorage.setItem(LEGACY_STORAGE_KEY, '{"stale":true}');

      expect(GameRepository.hasSavedGame()).toBe(true);
      expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    });
  });

  it('reports a payload with the wrong save version as no saved game', () => {
    const saved = GameStateMapper.dehydrate(buildPlayedState());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, saveVersion: 1 }));

    expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
    expect(GameRepository.hasSavedGame()).toBe(false);
  });

  it('abandons a version-2 save, whose container still has the three named slots (MS-109)', () => {
    const { championshipContainer, ...rest } = GameStateMapper.dehydrate(buildPlayedState());
    const versionTwo = {
      ...rest,
      saveVersion: 2,
      championshipContainer: { playableChampionship: championshipContainer.championships[0] },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(versionTwo));

    expect(GameRepository.hasSavedGame()).toBe(false);
    expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
  });

  describe('hasSavedGame', () => {
    it('agrees with loadGame when a save is present', () => {
      GameRepository.saveGame(buildPlayedState());

      expect(GameRepository.hasSavedGame()).toBe(true);
      expect(() => GameRepository.loadGame()).not.toThrow();
    });

    it('agrees with loadGame when no save is present', () => {
      expect(GameRepository.hasSavedGame()).toBe(false);
      expect(() => GameRepository.loadGame()).toThrow('Saved game could not be found.');
    });

    it('does not parse the container', () => {
      GameRepository.saveGame(buildPlayedState());
      const parse = jest.spyOn(JSON, 'parse');

      try {
        expect(GameRepository.hasSavedGame()).toBe(true);
        expect(parse).not.toHaveBeenCalled();
      } finally {
        parse.mockRestore();
      }
    });
  });
});
