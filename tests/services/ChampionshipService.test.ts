import { describe, expect, it } from '@jest/globals';

import ChampionshipService from '../../core/services/ChampionshipService';

describe('ChampionshipService.initChampionships', () => {
  it('returns a container with playableChampionship populated', () => {
    const container = ChampionshipService.initChampionships('brasileirao-serie-b');

    expect(container.succeeded).toBe(true);
  });
});
