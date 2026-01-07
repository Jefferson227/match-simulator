import { initChampionships } from '../use-cases/ChampionshipUseCases';
import ChampionshipDTO from '../core/data-transfer-objects/ChampionshipDTO';

describe('initChampionships', () => {
  it('creates a ChampionshipDTO from the given internal name', () => {
    const dto: ChampionshipDTO = initChampionships('premier-league');

    expect(dto).toEqual({
      name: 'Premier League',
      internalName: 'premier-league',
      numberOfTeams: 20,
      startingTeams: expect.any(Array), // or a concrete Team[] once you implement it
      standings: expect.any(Array),
      matches: expect.any(Object),
      type: expect.any(String),
      hasTeamControlledByHuman: false,
    });
  });
});
