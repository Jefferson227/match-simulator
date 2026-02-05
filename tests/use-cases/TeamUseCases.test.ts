import { describe, expect, it } from '@jest/globals';
import * as TeamUseCases from '../../use-cases/TeamUseCases';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';

describe('getTeamsToSelect', () => {
  it('returns a successful result from TeamUseCases.getTeamsToSelect()', () => {
    const mockedChampionshipContainer = {} as ChampionshipContainer;
    const result = TeamUseCases.getTeamsToSelect(mockedChampionshipContainer);

    expect(result.succeeded).toBeTruthy();
    expect(
      result.getResult().length === mockedChampionshipContainer.playableChampionship.numberOfTeams
    );
  });
});
