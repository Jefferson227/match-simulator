import { describe, expect, it } from '@jest/globals';
import { initChampionships } from '../../core/services/ChampionshipService';

describe('initChampionships', () => {
  it('returns a container with playableChampionship populated', () => {
    const container = initChampionships('brasileirao-serie-b');

    expect(container.succeeded).toBe(true);
  });
});
