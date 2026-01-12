import { describe, expect, it } from '@jest/globals';
import { initChampionships } from '../../core/services/ChampionshipService';
import ChampionshipContainer from '../../core/models/ChampionshipContainer';

describe('initChampionships', () => {
  it('returns a container with playableChampionship populated', () => {
    const container = initChampionships('brasileirao-serie-b');

    expect(container.succeeded).toBe(true);
  });

  it('returns a container with promotionChampionship populated', () => {
    const result = initChampionships('brasileirao-serie-b');
    let champContainer = {} as ChampionshipContainer;
    if (result.succeeded) {
      champContainer = result.getResult();
    }

    if (!champContainer.playableChampionship.isPromotable) return;

    expect(champContainer.promotionChampionship).toBeDefined();
    expect(result.succeeded).toBe(true);
  });

  it('returns a container with relegationChampionship populated', () => {
    const result = initChampionships('brasileirao-serie-b');
    let champContainer = {} as ChampionshipContainer;
    if (result.succeeded) {
      champContainer = result.getResult();
    }

    if (!champContainer.playableChampionship.isRelegatable) return;

    expect(champContainer.relegationChampionship).toBeDefined();
    expect(result.succeeded).toBe(true);
  });
});
