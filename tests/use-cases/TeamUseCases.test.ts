import { describe, expect, it } from '@jest/globals';
import * as TeamUseCases from '../../use-cases/TeamUseCases';
import { Championship } from '../../core/models/Championship';

function buildMockChampionship(): Championship {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Mock Championship',
    internalName: 'mock-championship',
    numberOfTeams: 2,
    teams: [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        fullName: 'Mock Team A',
        shortName: 'Team A',
        abbreviation: 'MTA',
        colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
        players: [
          {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            position: 'GK',
            name: 'Goalkeeper A',
            strength: 50,
          },
        ],
        morale: 50,
        isControlledByHuman: false,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        fullName: 'Mock Team B',
        shortName: 'Team B',
        abbreviation: 'MTB',
        colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
        players: [
          {
            id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            position: 'GK',
            name: 'Goalkeeper B',
            strength: 50,
          },
        ],
        morale: 50,
        isControlledByHuman: false,
      },
    ],
    standings: [],
    matchContainer: {
      timer: 0,
      currentSeason: 2024,
      currentRound: 1,
      totalRounds: 2,
      rounds: [
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          number: 1,
          matches: [
            {
              id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
              homeTeam: {
                id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                fullName: 'Mock Team A',
                shortName: 'Team A',
                abbreviation: 'MTA',
                colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
                players: [
                  {
                    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                    position: 'GK',
                    name: 'Goalkeeper A',
                    strength: 50,
                    isStarter: true,
                    isSub: false,
                  },
                ],
                morale: 50,
                isControlledByHuman: false,
              },
              awayTeam: {
                id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
                fullName: 'Mock Team B',
                shortName: 'Team B',
                abbreviation: 'MTB',
                colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
                players: [
                  {
                    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
                    position: 'GK',
                    name: 'Goalkeeper B',
                    strength: 50,
                    isStarter: true,
                    isSub: false,
                  },
                ],
                morale: 50,
                isControlledByHuman: false,
              },
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

describe('getTeamsToSelect', () => {
  it('returns a successful result from TeamUseCases.getTeamsToSelect()', () => {
    const mockedChampionship = buildMockChampionship();
    const result = TeamUseCases.getTeamsToSelect(mockedChampionship);

    expect(result.succeeded).toBeTruthy();
    expect(result.getResult().length === mockedChampionship.numberOfTeams);
  });
});

describe('selectTeam', () => {
  it('marks the selected team as controlled by human', () => {
    const mockedChampionship = buildMockChampionship();
    const teamToSelectId = mockedChampionship.teams[1].id;
    const result = TeamUseCases.selectTeam(mockedChampionship, teamToSelectId);
    expect(result.succeeded).toBeTruthy();

    const updatedChampionship = result.getResult();
    const selectedTeam = updatedChampionship.teams.find((team) => team.id === teamToSelectId);
    expect(selectedTeam).toBeDefined();
    expect(selectedTeam?.isControlledByHuman).toBeTruthy();

    const updatedMatch = updatedChampionship.matchContainer.rounds[0].matches[0];
    expect(updatedMatch.awayTeam.id).toBe(teamToSelectId);
    expect(updatedMatch.awayTeam.isControlledByHuman).toBeTruthy();
    expect(updatedMatch.homeTeam.isControlledByHuman).toBeFalsy();
  });
});
