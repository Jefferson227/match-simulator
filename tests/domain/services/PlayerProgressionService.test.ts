import { describe, expect, it, jest } from '@jest/globals';
import PlayerProgressionService from '../../../src/domain/services/PlayerProgressionService';
import Player from '../../../src/domain/models/Player';
import { Team } from '../../../src/domain/models/Team';
import { RandomProvider } from '../../../src/domain/features/match-simulation/types';

const range = { min: 25, max: 49 };

function buildPlayer(index: number, age: number, strength: number): Player {
  return {
    id: `${index}0000000-0000-0000-0000-000000000000` as Player['id'],
    position: 'MF',
    name: `Player ${index}`,
    strength,
    age,
    nationalities: ['BRA'],
    seasonGames: 0,
    seasonGoals: 0,
    strengthProgressGames: 0,
    isStarter: index === 0,
    isSub: false,
  };
}

/** Always rolls 1, so every gain inside the band below its top lands. */
const alwaysGains: RandomProvider = { nextInt: () => 1 };

function buildTeam(morale: number, players: Player[], level?: number): Team {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Club',
    shortName: 'Club',
    abbreviation: 'CLU',
    colors: { outline: '#000', background: '#fff', text: '#000' },
    players,
    morale,
    isControlledByHuman: false,
    ...(level !== undefined && { level }),
  };
}

describe('PlayerProgressionService.progressTeamPlayers', () => {
  // 20: developing, 30: experienced, 38: veteran.
  const squad = [buildPlayer(0, 20, 30), buildPlayer(1, 30, 30), buildPlayer(2, 38, 30)];

  it('returns the club untouched when it played no games', () => {
    const team = buildTeam(50, squad);
    expect(PlayerProgressionService.progressTeamPlayers(team, 0, range, alwaysGains)).toBe(team);
  });

  it('counts one game for every player, starters or not', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(50, squad),
      1,
      range,
      alwaysGains
    );

    expect(progressed.players.map((player) => player.strengthProgressGames)).toEqual([1, 1, 1]);
    expect(progressed.players.map((player) => player.strength)).toEqual([30, 30, 30]);
  });

  it('advances once per game played, each player at their own interval', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(50, squad),
      5,
      range,
      alwaysGains
    );

    // Mid morale: developing gains every 3, experienced holds every 4, veteran loses every 3.
    expect(progressed.players.map((player) => player.strength)).toEqual([31, 30, 29]);
    expect(progressed.players.map((player) => player.strengthProgressGames)).toEqual([2, 1, 2]);
  });

  it("reads the club's morale, decreasing the squad when it is low", () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(30, squad),
      3,
      range,
      alwaysGains
    );

    expect(progressed.players.map((player) => player.strength)).toEqual([29, 30, 29]);
  });

  describe('club band (MS-116)', () => {
    // Level 30 in 25–49: the band is 27–33.
    const level = 30;

    it('pulls toward the band around the level, not the whole range', () => {
      // A 26-year-old at mid morale holds inside the band, so only the pull moves them.
      const above = buildTeam(50, [buildPlayer(0, 26, 40)], level);
      expect(
        PlayerProgressionService.progressTeamPlayers(above, 4, range, alwaysGains).players[0]
          .strength
      ).toBe(38);
    });

    it('never gains past the band top, though the range goes higher', () => {
      const atBandTop = buildTeam(80, [buildPlayer(0, 20, 33)], level);
      expect(
        PlayerProgressionService.progressTeamPlayers(atBandTop, 2, range, alwaysGains).players[0]
          .strength
      ).toBe(33);
    });

    it('falls back to the range when the club has no level', () => {
      const noLevel = buildTeam(50, [buildPlayer(0, 26, 40)]);
      expect(
        PlayerProgressionService.progressTeamPlayers(noLevel, 4, range, alwaysGains).players[0]
          .strength
      ).toBe(40);

      const gains = buildTeam(80, [buildPlayer(0, 20, 33)]);
      expect(
        PlayerProgressionService.progressTeamPlayers(gains, 2, range, alwaysGains).players[0]
          .strength
      ).toBe(34);
    });

    it("rolls every gain from the given rng, over the band's width", () => {
      const nextInt = jest.fn((_min: number, _max: number) => 1);
      const progressed = PlayerProgressionService.progressTeamPlayers(
        buildTeam(80, [buildPlayer(0, 20, 30)], level),
        4,
        range,
        { nextInt }
      );

      expect(nextInt.mock.calls).toEqual([
        [1, 6],
        [1, 6],
      ]);
      expect(progressed.players[0].strength).toBe(32);
    });
  });

  it('pulls a squad outside the range back toward it', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(80, [buildPlayer(0, 20, 10)]),
      4,
      range,
      alwaysGains
    );

    // Developing at high morale: a change every 2 games, +2 each while below the range.
    expect(progressed.players[0].strength).toBe(14);
  });
});
