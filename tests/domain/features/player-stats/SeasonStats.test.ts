import { describe, expect, it } from '@jest/globals';
import {
  applyMatchStats,
  goalsByPlayer,
  playersWhoAppeared,
} from '../../../../src/domain/features/player-stats/SeasonStats';
import Match from '../../../../src/domain/models/Match';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';

const uuid = (seed: string) =>
  `${seed.padEnd(8, '0')}-0000-0000-0000-000000000000` as Player['id'];

const playerOf = (seed: string, overrides: Partial<Player> = {}): Player => ({
  id: uuid(seed),
  position: 'MF',
  name: seed,
  strength: 50,
  age: 25,
  nationalities: ['BRA'],
  xp: 0,
  seasonGames: 0,
  seasonGoals: 0,
  isStarter: false,
  isSub: false,
  ...overrides,
});

const teamOf = (seed: string, players: Player[]): Team => ({
  id: uuid(seed),
  fullName: seed,
  shortName: seed,
  abbreviation: seed.slice(0, 3).toUpperCase(),
  colors: { outline: '#000', background: '#fff', text: '#000' },
  players,
  morale: 50,
  isControlledByHuman: false,
});

const starter = playerOf('starter', { isStarter: true });
const cameOn = playerOf('cameon', { isStarter: true, enteredAtMinute: 60 });
const wentOff = playerOf('wentoff', { leftAtMinute: 60 });
const unusedSub = playerOf('unused', { isSub: true });
const reserve = playerOf('reserve');

const home = teamOf('home', [starter, cameOn, wentOff, unusedSub, reserve]);
const awayStriker = playerOf('awaystr', { isStarter: true });
const away = teamOf('away', [awayStriker]);

const matchOf = (overrides: Partial<Match> = {}): Match => ({
  id: 'match',
  homeTeam: home,
  homeTeamScore: 0,
  awayTeamScore: 0,
  awayTeam: away,
  scorers: [],
  ...overrides,
});

/** The clubs as `championship.teams` holds them: no match-scoped field set. */
const canonical = (team: Team): Team => ({
  ...team,
  players: team.players.map(({ enteredAtMinute, leftAtMinute, ...player }) => ({
    ...player,
    isStarter: false,
    isSub: false,
  })),
});

const counterOf = (teams: Team[], player: Player) =>
  teams.flatMap((team) => team.players).find((candidate) => candidate.id === player.id)!;

describe('SeasonStats', () => {
  describe('playersWhoAppeared', () => {
    const appeared = playersWhoAppeared(home).map((player) => player.id);

    it('counts a starter', () => {
      expect(appeared).toContain(starter.id);
    });

    it('counts a substitute who came on', () => {
      expect(appeared).toContain(cameOn.id);
    });

    it('counts a starter substituted off', () => {
      expect(appeared).toContain(wentOff.id);
    });

    it('does not count an unused substitute or a player left out', () => {
      expect(appeared).not.toContain(unusedSub.id);
      expect(appeared).not.toContain(reserve.id);
    });
  });

  describe('goalsByPlayer', () => {
    it('adds 2 goals for a brace', () => {
      const match = matchOf({
        homeTeamScore: 2,
        scorers: [
          { player: starter, scorerTeam: 'home', time: 10 },
          { player: starter, scorerTeam: 'home', time: 80 },
        ],
      });

      expect(goalsByPlayer(match).get(starter.id)).toBe(2);
    });

    it('does not count penalty-shootout kicks as goals', () => {
      const match = matchOf({
        penaltyShootout: {
          homeScore: 1,
          awayScore: 0,
          kicks: [
            { team: 'home', playerId: starter.id, scored: true },
            { team: 'away', playerId: awayStriker.id, scored: false },
          ],
        },
      });

      expect(goalsByPlayer(match).size).toBe(0);
    });
  });

  describe('applyMatchStats', () => {
    const teams = [canonical(home), canonical(away)];
    const match = matchOf({
      homeTeamScore: 2,
      awayTeamScore: 1,
      scorers: [
        { player: cameOn, scorerTeam: 'home', time: 70 },
        { player: cameOn, scorerTeam: 'home', time: 85 },
        { player: awayStriker, scorerTeam: 'away', time: 30 },
      ],
      penaltyShootout: {
        homeScore: 1,
        awayScore: 0,
        kicks: [{ team: 'home', playerId: starter.id, scored: true }],
      },
    });

    it('gives a game to everyone who appeared and nothing to the rest', () => {
      const updated = applyMatchStats(teams, [match]);

      expect(counterOf(updated, starter).seasonGames).toBe(1);
      expect(counterOf(updated, cameOn).seasonGames).toBe(1);
      expect(counterOf(updated, wentOff).seasonGames).toBe(1);
      expect(counterOf(updated, awayStriker).seasonGames).toBe(1);
      expect(counterOf(updated, unusedSub).seasonGames).toBe(0);
      expect(counterOf(updated, reserve).seasonGames).toBe(0);
    });

    it('adds goals from scorers only, shootout kicks excluded', () => {
      const updated = applyMatchStats(teams, [match]);

      expect(counterOf(updated, cameOn).seasonGoals).toBe(2);
      expect(counterOf(updated, awayStriker).seasonGoals).toBe(1);
      expect(counterOf(updated, starter).seasonGoals).toBe(0);
    });

    it('adds to the counters already there, one game per match', () => {
      const counted = teams.map((team) => ({
        ...team,
        players: team.players.map((player) => ({ ...player, seasonGames: 5, seasonGoals: 3 })),
      }));
      const secondMatch = matchOf({ id: 'second' });

      const updated = applyMatchStats(counted, [match, secondMatch]);

      expect(counterOf(updated, starter).seasonGames).toBe(7);
      expect(counterOf(updated, cameOn).seasonGoals).toBe(5);
      expect(counterOf(updated, unusedSub).seasonGames).toBe(5);
    });

    it('writes only the counters, never the match-scoped fields of the match copy', () => {
      const updated = applyMatchStats(teams, [match]);
      const players = updated.flatMap((team) => team.players);

      expect(players.every((player) => player.enteredAtMinute === undefined)).toBe(true);
      expect(players.every((player) => player.leftAtMinute === undefined)).toBe(true);
      expect(players.every((player) => !player.isStarter && !player.isSub)).toBe(true);
    });

    it('returns a club in none of the matches unchanged', () => {
      const bystander = canonical(teamOf('bystand', [playerOf('idle', { seasonGames: 4 })]));

      const updated = applyMatchStats([...teams, bystander], [match]);

      expect(updated[2]).toBe(bystander);
    });

    it('does not mutate its inputs', () => {
      const snapshot = JSON.stringify({ teams, match });

      applyMatchStats(teams, [match]);

      expect(JSON.stringify({ teams, match })).toBe(snapshot);
    });
  });
});
