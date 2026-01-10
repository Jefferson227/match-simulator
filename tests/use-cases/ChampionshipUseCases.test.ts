import { describe, expect, it } from '@jest/globals';

import { initChampionships } from '../../use-cases/ChampionshipUseCases';

describe('initChampionships', () => {
  it('returns a container with playableChampionship populated', () => {
    const container = initChampionships('brasileirao-serie-b');

    expect(container.playableChampionship).toBeDefined();
  });
});
