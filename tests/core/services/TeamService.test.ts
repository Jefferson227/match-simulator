import { describe, expect, it } from '@jest/globals';
import TeamService from '../../../core/services/TeamService';
import ChampionshipContainer from '../../../core/models/ChampionshipContainer';
import { Championship } from '../../../core/models/Championship';
import { Team } from '../../../core/models/Team';

function buildTeam(id: Team['id'], abbreviation: string, morale: number): Team {
  return {
    id,
    fullName: abbreviation,
    shortName: abbreviation,
    abbreviation,
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

function buildChampionship(teams: Team[], scores: Array<[number, number]>, currentRound = 2): Championship {
  const [homeTeam, awayTeam] = teams;

  return {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Mock Championship',
    internalName: 'mock-championship',
    numberOfTeams: teams.length,
    teams,
    standings: teams.map((team, index) => ({
      team,
      position: index + 1,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })),
    matchContainer: {
      timer: 0,
      currentSeason: 2026,
      currentRound,
      totalRounds: 2,
      rounds: [
        {
          id: 'round-1',
          number: 1,
          status: 'ended',
          matches: [
            {
              id: 'match-1',
              homeTeam,
              homeTeamScore: scores[0][0],
              awayTeamScore: scores[0][1],
              awayTeam,
              scorers: [],
            },
          ],
        },
      ],
    },
    type: 'double-round-robin',
    hasTeamControlledByHuman: false,
    isPromotable: false,
    isRelegatable: false,
  };
}

describe('TeamService.updateTeamStats', () => {
  it('updates morale according to win/draw/loss thresholds', () => {
    const lowMoraleWinner = buildTeam('11111111-1111-1111-1111-111111111111', 'LOW', 33);
    const mediumMoraleLoser = buildTeam('22222222-2222-2222-2222-222222222222', 'MID', 50);

    const championship = buildChampionship(
      [lowMoraleWinner, mediumMoraleLoser],
      [[2, 1]]
    );

    const result = TeamService.updateTeamStats({
      playableChampionship: championship,
    } as ChampionshipContainer);

    expect(result.succeeded).toBe(true);

    const updatedTeams = result.getResult().playableChampionship.teams;
    expect(updatedTeams.find((team) => team.id === lowMoraleWinner.id)?.morale).toBe(35);
    expect(updatedTeams.find((team) => team.id === mediumMoraleLoser.id)?.morale).toBe(48);
  });

  it('updates draw morale according to medium and high thresholds', () => {
    const mediumMoraleTeam = buildTeam('11111111-1111-1111-1111-111111111111', 'MED', 40);
    const highMoraleTeam = buildTeam('22222222-2222-2222-2222-222222222222', 'HIG', 80);

    const championship = buildChampionship([mediumMoraleTeam, highMoraleTeam], [[1, 1]]);

    const result = TeamService.updateTeamStats({
      playableChampionship: championship,
    } as ChampionshipContainer);

    const updatedTeams = result.getResult().playableChampionship.teams;
    expect(updatedTeams.find((team) => team.id === mediumMoraleTeam.id)?.morale).toBe(41);
    expect(updatedTeams.find((team) => team.id === highMoraleTeam.id)?.morale).toBe(80.5);
  });

  it('clamps morale between 0 and 100', () => {
    const highMoraleWinner = buildTeam('11111111-1111-1111-1111-111111111111', 'MAX', 100);
    const lowMoraleLoser = buildTeam('22222222-2222-2222-2222-222222222222', 'MIN', 0);

    const championship = buildChampionship([highMoraleWinner, lowMoraleLoser], [[3, 0]]);

    const result = TeamService.updateTeamStats({
      playableChampionship: championship,
    } as ChampionshipContainer);

    const updatedTeams = result.getResult().playableChampionship.teams;
    expect(updatedTeams.find((team) => team.id === highMoraleWinner.id)?.morale).toBe(100);
    expect(updatedTeams.find((team) => team.id === lowMoraleLoser.id)?.morale).toBe(0);
  });
});
