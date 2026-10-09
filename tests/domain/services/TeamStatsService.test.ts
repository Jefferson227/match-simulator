import { describe, expect, it } from '@jest/globals';
import TeamStatsService from '../../../src/domain/services/TeamStatsService';
import { Team } from '../../../src/domain/models/Team';
import Round from '../../../src/domain/models/Round';
import Player from '../../../src/domain/models/Player';
function buildTeam(id: Team['id'], morale: number, players: Player[] = []): Team {
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
    players,
    morale,
    isControlledByHuman: false,
  };
}

function buildRound(
  homeTeam: Team,
  awayTeam: Team,
  homeTeamScore: number,
  awayTeamScore: number
): Round {
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

describe('TeamStatsService.updateTeam', () => {
  it('updates low-morale winner correctly', () => {
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 33);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 50);
    const round = buildRound(homeTeam, awayTeam, 2, 1);

    const updatedTeam = TeamStatsService.updateTeam(homeTeam, {
      latestRound: round,
    });

    expect(updatedTeam.morale).toBe(35);
  });

  it('updates high-morale draw correctly', () => {
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 80);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 40);
    const round = buildRound(homeTeam, awayTeam, 1, 1);

    const updatedTeam = TeamStatsService.updateTeam(homeTeam, {
      latestRound: round,
    });

    expect(updatedTeam.morale).toBe(80.5);
  });

  it('clamps morale within valid bounds', () => {
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 0);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 100);
    const lossRound = buildRound(homeTeam, awayTeam, 0, 1);
    const winRound = buildRound(awayTeam, homeTeam, 2, 1);

    expect(
      TeamStatsService.updateTeam(homeTeam, {
        latestRound: lossRound,
      }).morale
    ).toBe(0);
    expect(
      TeamStatsService.updateTeam(awayTeam, {
        latestRound: winRound,
      }).morale
    ).toBe(100);
  });

  it('leaves every player as they were', () => {
    const players = [{ id: 'p1', strength: 40, strengthProgressGames: 2 }] as unknown as Player[];
    const homeTeam = buildTeam('11111111-1111-1111-1111-111111111111', 90, players);
    const awayTeam = buildTeam('22222222-2222-2222-2222-222222222222', 50);

    const updatedTeam = TeamStatsService.updateTeam(homeTeam, {
      latestRound: buildRound(homeTeam, awayTeam, 3, 0),
    });

    expect(updatedTeam.morale).toBe(91);
    expect(updatedTeam.players).toBe(players);
  });
});
