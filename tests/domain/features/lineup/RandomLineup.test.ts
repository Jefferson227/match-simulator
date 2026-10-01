import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { pickRandomLineup } from '../../../../src/domain/features/lineup/RandomLineup';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';

const POSITIONS: Player['position'][] = [
  'GK', 'GK', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF',
  'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW', 'FW', 'FW', 'MF',
]; // prettier-ignore

const squadOf = (positions: Player['position'][]): Team => ({
  id: 'team-0000-0000-0000-000000000000',
  fullName: 'Club',
  shortName: 'Club',
  abbreviation: 'CLB',
  colors: { outline: '#000', background: '#fff', text: '#000' },
  players: positions.map((position, index) => ({
    id: `player-${index}-0-0-0` as Player['id'],
    position,
    name: `Player ${index}`,
    strength: 50,
    age: 25,
    nationalities: ['BRA'],
    xp: 0,
    seasonGames: 0,
    seasonGoals: 0,
    isStarter: true,
    isSub: false,
  })),
  morale: 50,
  isControlledByHuman: false,
});

const seededRng = (seed: number): RandomProvider => ({
  nextInt: (min, max) =>
    min + ((seed = (seed * 1103515245 + 12345) % 2147483648) % (max - min + 1)),
});

const startersOf = (team: Team) => team.players.filter((player) => player.isStarter);

describe('pickRandomLineup', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('picks 11 starters, one of them a goalkeeper, and a bench of 6 from the rest', () => {
    const lineup = pickRandomLineup(squadOf(POSITIONS), seededRng(1));
    const starters = startersOf(lineup);
    const subs = lineup.players.filter((player) => player.isSub);

    expect(starters).toHaveLength(11);
    expect(starters.filter((player) => player.position === 'GK')).toHaveLength(1);
    expect(subs).toHaveLength(6);
    expect(subs.some((player) => player.isStarter)).toBe(false);
  });

  it('picks the same lineup from the same stream, and never calls Math.random', () => {
    const random = jest.spyOn(Math, 'random');

    const first = pickRandomLineup(squadOf(POSITIONS), seededRng(7));
    const second = pickRandomLineup(squadOf(POSITIONS), seededRng(7));

    expect(second).toEqual(first);
    expect(random).not.toHaveBeenCalled();
  });

  it('fields a goalkeeper and ten outfield players when no formation fits the squad', () => {
    const lineup = pickRandomLineup(squadOf(['GK', ...Array(12).fill('MF')]), seededRng(3));

    expect(startersOf(lineup)).toHaveLength(11);
    expect(startersOf(lineup).filter((player) => player.position === 'GK')).toHaveLength(1);
  });

  it('leaves the season counters as they were', () => {
    const squad = squadOf(POSITIONS);
    const counted = {
      ...squad,
      players: squad.players.map((player) => ({ ...player, seasonGames: 4, seasonGoals: 2 })),
    };

    const lineup = pickRandomLineup(counted, seededRng(5));

    expect(lineup.players.every((p) => p.seasonGames === 4 && p.seasonGoals === 2)).toBe(true);
  });
});
