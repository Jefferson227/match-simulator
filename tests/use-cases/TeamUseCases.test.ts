import { describe, expect, it } from '@jest/globals';
import * as TeamUseCases from '../../use-cases/TeamUseCases';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';

describe('getTeamsToSelect', () => {
  it('returns a successful result from TeamUseCases.getTeamsToSelect()', () => {
    const mockedChampionshipContainer: ChampionshipContainer = {
      playableChampionship: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Mock Championship',
        internalName: 'mock-championship',
        numberOfTeams: 2,
        startingTeams: [
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
            isControlledByHuman: true,
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
        matches: {
          timer: 0,
          currentSeason: 2024,
          currentRound: 1,
          totalRounds: 2,
          matches: [],
        },
        type: 'double-round-robin',
        hasTeamControlledByHuman: true,
        isPromotable: false,
        isRelegatable: false,
      },
    };
    const result = TeamUseCases.getTeamsToSelect(mockedChampionshipContainer);

    expect(result.succeeded).toBeTruthy();
    expect(
      result.getResult().length === mockedChampionshipContainer.playableChampionship.numberOfTeams
    );
  });
});
