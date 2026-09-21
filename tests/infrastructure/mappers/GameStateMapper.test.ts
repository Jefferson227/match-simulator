/**
 * MS-108: the save boundary. A saved game writes club and player references as ids and resolves
 * them back from `championship.teams`, so the duplicated squads that put a men's save over
 * `localStorage`'s quota are never serialised.
 *
 * Hand-built containers rather than a seeded season: this is the mapper's contract, and the real
 * containers are covered by `SavedGameSize.test.ts`.
 */
import { describe, expect, it } from '@jest/globals';
import GameStateMapper from '../../../src/infrastructure/mappers/GameStateMapper';
import { SavedGameState } from '../../../src/infrastructure/data-transfer-objects/GameStateSaveDTO';
import { Championship } from '../../../src/domain/models/Championship';
import Match from '../../../src/domain/models/Match';
import Player from '../../../src/domain/models/Player';
import Standing from '../../../src/domain/models/Standing';
import { Team } from '../../../src/domain/models/Team';
import { GameState } from '../../../src/game-engine/GameState';
import { resolveFromTeams } from '../../support/savedGameEquivalence';
import { containerOf } from '../../support/containerOf';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
} from '../../../src/domain/features/pyramid/Pyramid';

const uuid = (seed: string): Team['id'] =>
  `${seed.padEnd(8, '0')}-0000-0000-0000-000000000000` as Team['id'];

const playerOf = (teamSeed: string, index: number): Player => ({
  id: uuid(`p${teamSeed}${index}`) as Player['id'],
  position: index === 0 ? 'GK' : 'MF',
  name: `Player ${teamSeed}-${index}`,
  strength: 50 + index,
  age: 26,
  xp: index * 10,
  isStarter: index < 2,
  isSub: index >= 2,
});

const teamOf = (seed: string, morale = 70): Team => ({
  id: uuid(seed),
  fullName: `Club ${seed}`,
  shortName: `C${seed}`,
  abbreviation: seed.slice(0, 3).toUpperCase(),
  colors: { outline: '#000', background: '#fff', text: '#000' },
  players: [0, 1, 2].map((index) => playerOf(seed, index)),
  morale,
  isControlledByHuman: false,
});

const standingOf = (team: Team, position: number): Standing => ({
  team,
  position,
  wins: position,
  draws: 0,
  losses: 0,
  goalsFor: position * 2,
  goalsAgainst: 0,
  points: position * 3,
});

const matchOf = (id: string, homeTeam: Team, awayTeam: Team, played: boolean): Match => ({
  id: uuid(id),
  homeTeam,
  homeTeamScore: played ? 2 : 0,
  awayTeamScore: played ? 1 : 0,
  awayTeam,
  scorers: played
    ? [
        { player: homeTeam.players[2], scorerTeam: 'home', time: 12 },
        { player: awayTeam.players[1], scorerTeam: 'away', time: 78 },
      ]
    : [],
});

/**
 * Two divisions. The playable one is on round 2 of 2: round 1 is played and its fixtures carry a
 * *historical* snapshot of both clubs (lower morale, less xp) that is deliberately not preserved;
 * round 2 is the current round and must survive byte-identically.
 */
function buildState(): GameState {
  const alpha = teamOf('alpha');
  const beta = teamOf('beta');
  const gamma = teamOf('gamma');
  const delta = teamOf('delta');

  const stale = (team: Team): Team => ({
    ...team,
    morale: 1,
    players: team.players.map((player) => ({ ...player, xp: 0, strength: 1 })),
  });

  const playable: Championship = {
    id: uuid('champA'),
    name: 'Playable Division',
    internalName: 'playable-division',
    numberOfTeams: 4,
    teams: [alpha, beta, gamma, delta],
    standings: [alpha, beta, gamma, delta].map((team, index) => standingOf(team, index + 1)),
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
          matches: [
            matchOf('m1', stale(alpha), stale(beta), true),
            matchOf('m2', stale(gamma), stale(delta), true),
          ],
        },
        {
          id: uuid('r2'),
          number: 2,
          status: 'not-started',
          matches: [matchOf('m3', alpha, gamma, false), matchOf('m4', beta, delta, false)],
        },
      ],
    },
    type: 'double-round-robin',
    leagueType: 'mens',
    hasTeamControlledByHuman: true,
    firstPhaseStandings: [standingOf(alpha, 1), standingOf(beta, 2)],
    phaseStandings: [[standingOf(gamma, 1)], [standingOf(delta, 1)]],
    accumulatedStandings: [standingOf(delta, 1)],
    isPromotable: true,
    numberOfPromotableTeams: 2,
    promotionChampionshipInternalName: 'neighbour-division',
    isRelegatable: false,
  };

  // The neighbour is the one with staggered entry, so `phaseEntrants` is exercised.
  const neighbour: Championship = {
    id: uuid('champB'),
    name: 'Neighbour Division',
    internalName: 'neighbour-division',
    numberOfTeams: 2,
    teams: [gamma, delta],
    standings: [standingOf(gamma, 1), standingOf(delta, 2)],
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound: 1,
      totalRounds: 1,
      rounds: [
        {
          id: uuid('r3'),
          number: 1,
          status: 'not-started',
          matches: [matchOf('m5', gamma, delta, false)],
        },
      ],
    },
    type: 'knockout',
    leagueType: 'mens',
    hasTeamControlledByHuman: false,
    phaseEntrants: [[gamma], [delta]],
    isPromotable: false,
    isRelegatable: false,
  };

  return {
    championshipContainer: containerOf(playable, [neighbour]),
    hasError: false,
    errorMessage: '',
    currentScreen: 'TeamManager',
    gameConfig: { clockSpeed: 250 },
    leagueType: 'mens',
    coachName: 'Tester',
  };
}

/** The playable division of a saved payload, found by its pointer. */
const savedPlayableOf = (saved: SavedGameState) =>
  saved.championshipContainer.championships.find(
    (championship) => championship.internalName === saved.championshipContainer.playableInternalName
  )!;

const roundTrip = (state: GameState) =>
  GameStateMapper.hydrate(JSON.parse(JSON.stringify(GameStateMapper.dehydrate(state))));

describe('GameStateMapper', () => {
  it('round-trips a two-division container under the equivalence rule', () => {
    const state = buildState();

    expect(roundTrip(state)).toEqual(resolveFromTeams(state));
  });

  it('resolves match teams back to the clubs in `teams`', () => {
    const reloaded = roundTrip(buildState());
    const playable = getPlayableChampionship(reloaded.championshipContainer);
    const byId = new Map(playable.teams.map((team) => [team.id, team]));

    const playedRound = playable.matchContainer.rounds[0];
    playedRound.matches.forEach((match) => {
      expect(match.homeTeam).toEqual(byId.get(match.homeTeam.id));
      expect(match.awayTeam).toEqual(byId.get(match.awayTeam.id));
    });
  });

  it('resolves standings, including the per-phase tables', () => {
    const reloaded = roundTrip(buildState());
    const playable = getPlayableChampionship(reloaded.championshipContainer);

    expect(playable.standings.map((standing) => standing.team.fullName)).toEqual([
      'Club alpha',
      'Club beta',
      'Club gamma',
      'Club delta',
    ]);
    expect(playable.firstPhaseStandings?.map((standing) => standing.team.id)).toEqual([
      playable.teams[0].id,
      playable.teams[1].id,
    ]);
    expect(playable.phaseStandings?.map((table) => table[0].team.id)).toEqual([
      playable.teams[2].id,
      playable.teams[3].id,
    ]);
    expect(playable.accumulatedStandings?.[0].team.id).toBe(playable.teams[3].id);
  });

  it('resolves scorers back to full players', () => {
    const reloaded = roundTrip(buildState());
    const played = getPlayableChampionship(reloaded.championshipContainer).matchContainer.rounds[0];
    const scorers = played.matches[0].scorers;

    expect(scorers).toHaveLength(2);
    scorers.forEach((scorer) => {
      expect(scorer.player.name).toMatch(/^Player /);
      expect(scorer.player.position).toBeDefined();
    });
    expect(scorers[0].player.id).toBe(played.matches[0].homeTeam.players[2].id);
    expect(scorers[1].player.id).toBe(played.matches[0].awayTeam.players[1].id);
  });

  it('resolves `phaseEntrants` back to full clubs', () => {
    const reloaded = roundTrip(buildState());
    const neighbour = getChampionshipByInternalName(
      reloaded.championshipContainer,
      'neighbour-division'
    )!;

    expect(
      neighbour.phaseEntrants?.map((entrants) => entrants.map((team) => team.fullName))
    ).toEqual([['Club gamma'], ['Club delta']]);
    expect(neighbour.phaseEntrants?.[0][0].players).toHaveLength(3);
  });

  it('serialises no squad outside `teams` and `currentRoundTeams`', () => {
    const saved = GameStateMapper.dehydrate(buildState());

    const stripped = JSON.parse(JSON.stringify(saved));
    const forEachChampionship = (visit: (championship: Record<string, unknown>) => void) =>
      (stripped.championshipContainer.championships as unknown[]).forEach((championship) =>
        visit(championship as Record<string, unknown>)
      );
    forEachChampionship((championship) => {
      delete championship.teams;
      delete championship.currentRoundTeams;
    });

    expect(JSON.stringify(stripped)).not.toContain('"players"');
    expect(JSON.stringify(stripped)).not.toContain('"morale"');
  });

  it('keeps the current round byte-identical, snapshot included', () => {
    const state = buildState();
    const currentRound = getPlayableChampionship(state.championshipContainer).matchContainer
      .rounds[1];

    const reloaded = roundTrip(state);
    const reloadedRound = getPlayableChampionship(reloaded.championshipContainer).matchContainer
      .rounds[1];

    expect(reloadedRound).toEqual(currentRound);
    expect(reloadedRound.matches[0].homeTeam.morale).toBe(currentRound.matches[0].homeTeam.morale);
    expect(reloadedRound.matches[0].homeTeam.players).toEqual(
      currentRound.matches[0].homeTeam.players
    );
  });

  it('drops the historical snapshot of a round already played', () => {
    // The documented cost of dehydration: a played fixture references the club as it is now.
    const state = buildState();
    const playedBefore = getPlayableChampionship(state.championshipContainer).matchContainer
      .rounds[0].matches[0];
    expect(playedBefore.homeTeam.morale).toBe(1);

    const playedAfter = getPlayableChampionship(roundTrip(state).championshipContainer)
      .matchContainer.rounds[0].matches[0];

    expect(playedAfter.homeTeam.morale).toBe(70);
    expect(playedAfter.homeTeam.id).toBe(playedBefore.homeTeam.id);
  });

  it('throws naming the id when a team cannot be resolved', () => {
    const saved = GameStateMapper.dehydrate(buildState()) as SavedGameState;
    const orphan = uuid('orphan');
    savedPlayableOf(saved).matchContainer.rounds[0].matches[0].homeTeamId = orphan;

    expect(() => GameStateMapper.hydrate(saved)).toThrow(
      `Saved game references unknown team ${orphan}.`
    );
  });

  it('throws naming the id when a scorer cannot be resolved', () => {
    const saved = GameStateMapper.dehydrate(buildState()) as SavedGameState;
    const orphan = uuid('ghost') as Player['id'];
    savedPlayableOf(saved).matchContainer.rounds[0].matches[0].scorers[0].playerId = orphan;

    expect(() => GameStateMapper.hydrate(saved)).toThrow(
      `Saved game references unknown player ${orphan}.`
    );
  });
});
