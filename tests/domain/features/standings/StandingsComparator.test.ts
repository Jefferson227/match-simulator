import { describe, expect, it } from '@jest/globals';
import {
  compareStandings,
  rankStandings,
} from '../../../../src/domain/features/standings/StandingsComparator';
import Standing from '../../../../src/domain/models/Standing';
import { Team } from '../../../../src/domain/models/Team';

function buildTeam(abbreviation: string): Team {
  return {
    id: `team-${abbreviation}` as Team['id'],
    fullName: abbreviation,
    shortName: abbreviation,
    abbreviation,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function standing(
  abbreviation: string,
  fields: Partial<Omit<Standing, 'team' | 'position'>>
): Standing {
  return {
    team: buildTeam(abbreviation),
    position: 1,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    ...fields,
  };
}

describe('compareStandings', () => {
  it('ranks points first', () => {
    const more = standing('BBB', { points: 10, wins: 2 });
    const fewer = standing('AAA', { points: 9, wins: 3, goalsFor: 20 });

    expect(compareStandings(more, fewer)).toBeLessThan(0);
  });

  it('ranks more wins above better goal difference when points are level', () => {
    // Série C 2025, 1ª Fase 16º/17º: Itabaiana 22 pts, 6 wins, GD −4 stays up; CSA 22 pts, 5 wins,
    // GD −2 is relegated (REC C Art. 16).
    const itabaiana = standing('ITA', {
      points: 22,
      wins: 6,
      draws: 4,
      goalsFor: 16,
      goalsAgainst: 20,
    });
    const csa = standing('CSA', { points: 22, wins: 5, draws: 7, goalsFor: 18, goalsAgainst: 20 });

    expect(compareStandings(itabaiana, csa)).toBeLessThan(0);
    expect(rankStandings([csa, itabaiana]).map((row) => row.team.abbreviation)).toEqual([
      'ITA',
      'CSA',
    ]);
  });

  it('falls through to goal difference when points and wins are level', () => {
    const better = standing('ZZZ', { points: 10, wins: 3, goalsFor: 8, goalsAgainst: 2 });
    const worse = standing('AAA', { points: 10, wins: 3, goalsFor: 8, goalsAgainst: 5 });

    expect(compareStandings(better, worse)).toBeLessThan(0);
  });

  it('then falls through to goals for, then abbreviation', () => {
    const moreGoals = standing('ZZZ', { points: 10, wins: 3, goalsFor: 9, goalsAgainst: 4 });
    const fewerGoals = standing('AAA', { points: 10, wins: 3, goalsFor: 8, goalsAgainst: 3 });
    expect(compareStandings(moreGoals, fewerGoals)).toBeLessThan(0);

    const alphaFirst = standing('AAA', { points: 10, wins: 3, goalsFor: 8, goalsAgainst: 3 });
    const alphaSecond = standing('BBB', { points: 10, wins: 3, goalsFor: 8, goalsAgainst: 3 });
    expect(compareStandings(alphaFirst, alphaSecond)).toBeLessThan(0);
  });
});
