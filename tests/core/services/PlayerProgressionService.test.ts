import { describe, expect, it } from '@jest/globals';
import PlayerProgressionService from '../../../core/services/PlayerProgressionService';
import Player from '../../../core/models/Player';
import Round from '../../../core/models/Round';
import { Team } from '../../../core/models/Team';

function buildPlayer(id: Player['id'], strength: number, xp: number): Player {
  return {
    id,
    position: 'MF',
    name: id,
    strength,
    xp,
    isStarter: true,
    isSub: false,
  };
}

function buildTeam(id: Team['id'], morale: number): Team {
  return {
    id,
    fullName: id,
    shortName: id,
    abbreviation: id.slice(0, 3),
    colors: {
      outline: '#111111',
      background: '#222222',
      text: '#ffffff',
    },
    players: [],
    morale,
    isControlledByHuman: false,
  };
}

function buildRound(homeTeam: Team, awayTeam: Team, homeTeamScore: number, awayTeamScore: number): Round {
  return {
    id: 'round-1',
    number: 1,
    status: 'ended',
    matches: [
      {
        id: 'match-1',
        homeTeam,
        homeTeamScore,
        awayTeamScore,
        awayTeam,
        scorers: [],
      },
    ],
  };
}

describe('PlayerProgressionService', () => {
  it('returns the last five finished results in reverse chronological order', () => {
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 50);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 50);
    const rounds = [
      { ...buildRound(homeTeam, awayTeam, 1, 0), id: 'round-1', number: 1 },
      { ...buildRound(homeTeam, awayTeam, 1, 1), id: 'round-2', number: 2 },
      { ...buildRound(homeTeam, awayTeam, 0, 1), id: 'round-3', number: 3 },
      { ...buildRound(homeTeam, awayTeam, 2, 1), id: 'round-4', number: 4 },
      { ...buildRound(homeTeam, awayTeam, 3, 0), id: 'round-5', number: 5 },
      { ...buildRound(homeTeam, awayTeam, 0, 2), id: 'round-6', number: 6 },
    ];

    const results = PlayerProgressionService.getLastFiveResults(homeTeam, rounds);

    expect(results).toEqual(['loss', 'win', 'win', 'loss', 'draw']);
  });

  it('updates players using the team recent form', () => {
    const player = buildPlayer('55555555-5555-5555-5555-555555555555', 50, 239);
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 50);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 50);
    const rounds = [
      buildRound(homeTeam, awayTeam, 1, 0),
      buildRound(homeTeam, awayTeam, 2, 1),
      buildRound(homeTeam, awayTeam, 3, 2),
      buildRound(homeTeam, awayTeam, 1, 0),
      buildRound(homeTeam, awayTeam, 2, 0),
    ].map((round, index) => ({ ...round, id: `round-${index + 1}`, number: index + 1 }));

    const updatedPlayers = PlayerProgressionService.updatePlayers(
      [player],
      53,
      homeTeam,
      rounds,
      () => 0.5
    );

    expect(updatedPlayers[0].strength).toBe(51);
    expect(updatedPlayers[0].xp).toBeCloseTo(2.989304, 6);
  });

  it('defaults missing xp to zero before applying progression', () => {
    const playerWithoutXp = {
      ...buildPlayer('55555555-5555-5555-5555-555555555555', 50, 0),
      xp: undefined,
    } as unknown as Player;
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 50);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 50);
    const rounds = [buildRound(homeTeam, awayTeam, 1, 0)];

    const updatedPlayers = PlayerProgressionService.updatePlayers(
      [playerWithoutXp],
      52,
      homeTeam,
      rounds,
      () => 0.5
    );

    expect(Number.isNaN(updatedPlayers[0].xp)).toBe(false);
  });
});
