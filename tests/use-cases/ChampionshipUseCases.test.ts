import { describe, expect, it } from '@jest/globals';

import { initChampionships, getChampionships } from '../../use-cases/ChampionshipUseCases';

describe('initChampionships', () => {
  it('returns a successful result from ChampionshipService', () => {
    const result = initChampionships('brasileirao-serie-b');
    expect(result.succeeded).toBeTruthy();
  });

  it('returns a container with playableChampionship populated', () => {
    const brasileiraoSerieB = 'brasileirao-serie-b';
    const result = initChampionships(brasileiraoSerieB);
    expect(result.getResult().playableChampionship.internalName).toBe(brasileiraoSerieB);
  });
});

describe('getChampionships', () => {
  it('returns a successful result from getChampionships', () => {
    const result = getChampionships();
    expect(result.succeeded).toBeTruthy();
  });

  it('returns a list of championships', () => {
    const result = getChampionships();
    expect(result.getResult().length > 0).toBeTruthy();
  });
});
