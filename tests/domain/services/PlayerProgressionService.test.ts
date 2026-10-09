import { describe, expect, it } from '@jest/globals';
import PlayerProgressionService from '../../../src/domain/services/PlayerProgressionService';
import Player from '../../../src/domain/models/Player';
import { Team } from '../../../src/domain/models/Team';

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

function buildTeam(morale: number, players: Player[]): Team {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    fullName: 'Club',
    shortName: 'Club',
    abbreviation: 'CLU',
    colors: { outline: '#000', background: '#fff', text: '#000' },
    players,
    morale,
    isControlledByHuman: false,
  };
}

describe('PlayerProgressionService.progressTeamPlayers', () => {
  const squad = [buildPlayer(0, 20, 30), buildPlayer(1, 30, 30), buildPlayer(2, 38, 30)];

  it('returns the club untouched when it played no games', () => {
    const team = buildTeam(50, squad);
    expect(PlayerProgressionService.progressTeamPlayers(team, 0, range)).toBe(team);
  });

  it('counts one game for every player, starters or not', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(50, squad),
      1,
      range
    );

    expect(progressed.players.map((player) => player.strengthProgressGames)).toEqual([1, 1, 1]);
    expect(progressed.players.map((player) => player.strength)).toEqual([30, 30, 30]);
  });

  it('advances once per game played, each player at their own interval', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(50, squad),
      5,
      range
    );

    // Mid morale: every 3 games under 26, every 4 at 26–35, every 5 from 36.
    expect(progressed.players.map((player) => player.strength)).toEqual([31, 31, 31]);
    expect(progressed.players.map((player) => player.strengthProgressGames)).toEqual([2, 1, 0]);
  });

  it("reads the club's morale, decreasing the squad when it is low", () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(30, squad),
      3,
      range
    );

    expect(progressed.players.map((player) => player.strength)).toEqual([29, 30, 30]);
  });

  it('pulls a squad outside the range back toward it', () => {
    const progressed = PlayerProgressionService.progressTeamPlayers(
      buildTeam(80, [buildPlayer(0, 20, 10)]),
      3,
      range
    );

    expect(progressed.players[0].strength).toBe(16);
  });
});
