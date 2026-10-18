import { describe, expect, it, jest } from '@jest/globals';
import {
  AgeBand,
  Direction,
  MoraleBand,
  advancePlayer,
  getAgeBand,
  getDirection,
  getInterval,
  getMoraleBand,
  getStep,
} from '../../../../src/domain/features/strength-progression/ProgressionPolicy';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

const band = { min: 34, max: 40 };

/** Always draws `value`, and records every draw it was asked for. */
const fixedRng = (value: number) => {
  const nextInt = jest.fn((_min: number, _max: number) => value);
  return { nextInt } satisfies RandomProvider;
};

/** Fails the test if drawn from. */
const noRng: RandomProvider = {
  nextInt: () => {
    throw new Error('rng should not be drawn from');
  },
};

describe('getMoraleBand', () => {
  it.each([
    [0, 'low'],
    [30, 'low'],
    [30.5, 'mid'],
    [50, 'mid'],
    [70, 'mid'],
    [70.5, 'high'],
    [100, 'high'],
  ])('puts morale %p in the %s band', (morale, moraleBand) => {
    expect(getMoraleBand(morale)).toBe(moraleBand);
  });
});

describe('getAgeBand', () => {
  it.each([
    [15, 'developing'],
    [23, 'developing'],
    [24, 'peak'],
    [29, 'peak'],
    [30, 'experienced'],
    [33, 'experienced'],
    [34, 'veteran'],
    [44, 'veteran'],
  ])('puts age %p in the %s band', (age, ageBand) => {
    expect(getAgeBand(age)).toBe(ageBand);
  });
});

describe('getDirection', () => {
  it.each([
    ['developing', 'low', 'decrease'],
    ['developing', 'mid', 'increase'],
    ['developing', 'high', 'increase'],
    ['peak', 'low', 'decrease'],
    ['peak', 'mid', 'hold'],
    ['peak', 'high', 'increase'],
    ['experienced', 'low', 'decrease'],
    ['experienced', 'mid', 'hold'],
    ['experienced', 'high', 'hold'],
    ['veteran', 'low', 'decrease'],
    ['veteran', 'mid', 'decrease'],
    ['veteran', 'high', 'decrease'],
  ] as [AgeBand, MoraleBand, Direction][])('%s age × %s morale → %s', (age, morale, direction) => {
    expect(getDirection(morale, age)).toBe(direction);
  });
});

describe('getInterval', () => {
  it.each([
    ['developing', 'low', 3],
    ['developing', 'mid', 3],
    ['developing', 'high', 2],
    ['peak', 'low', 4],
    ['peak', 'mid', 4],
    ['peak', 'high', 2],
    ['experienced', 'low', 4],
    ['experienced', 'mid', 4],
    ['experienced', 'high', 3],
    ['veteran', 'low', 3],
    ['veteran', 'mid', 3],
    ['veteran', 'high', 3],
  ] as [AgeBand, MoraleBand, number][])(
    '%s age × %s morale → every %p games',
    (age, morale, interval) => {
      expect(getInterval(morale, age)).toBe(interval);
    }
  );
});

describe('getStep', () => {
  describe('increase', () => {
    it('rolls 1..band width and gains when the roll is within max − strength', () => {
      const rng = fixedRng(4);
      // 40 − 36 = 4: a roll of 4 gains.
      expect(getStep(36, band, 'increase', rng)).toBe(37);
      expect(rng.nextInt).toHaveBeenCalledWith(1, 6);
    });

    it('does not gain when the roll is above max − strength', () => {
      // 40 − 36 = 4: a roll of 5 does not.
      expect(getStep(36, band, 'increase', fixedRng(5))).toBe(36);
    });

    it('always gains at the band min, even on the highest roll', () => {
      expect(getStep(34, band, 'increase', fixedRng(6))).toBe(35);
    });

    it('never gains at the band max, even on the lowest roll', () => {
      expect(getStep(40, band, 'increase', fixedRng(1))).toBe(40);
    });

    it('neither rolls nor changes in a one-point band', () => {
      expect(getStep(49, { min: 49, max: 49 }, 'increase', noRng)).toBe(49);
    });
  });

  describe('hold', () => {
    it('changes nothing inside the band, without a roll', () => {
      expect(getStep(37, band, 'hold', noRng)).toBe(37);
      expect(getStep(34, band, 'hold', noRng)).toBe(34);
      expect(getStep(40, band, 'hold', noRng)).toBe(40);
    });
  });

  describe('decrease', () => {
    it('takes 1 inside the band, without a roll', () => {
      expect(getStep(37, band, 'decrease', noRng)).toBe(36);
    });

    it('never passes the band min', () => {
      expect(getStep(34, band, 'decrease', noRng)).toBe(34);
    });
  });

  describe.each(['increase', 'hold', 'decrease'] as Direction[])(
    'outside the band, %s',
    (direction) => {
      it('adds 2 below the band, without a roll', () => {
        expect(getStep(30, band, direction, noRng)).toBe(32);
      });

      it('may land inside the band from below', () => {
        expect(getStep(33, band, direction, noRng)).toBe(35);
      });

      it('takes 2 above the band, without a roll', () => {
        expect(getStep(45, band, direction, noRng)).toBe(43);
      });

      it('may land inside the band from above', () => {
        expect(getStep(41, band, direction, noRng)).toBe(39);
      });
    }
  );

  it('clamps the pull to 1–99', () => {
    expect(getStep(98, { min: 99, max: 99 }, 'decrease', noRng)).toBe(99);
    expect(getStep(2, { min: 1, max: 1 }, 'increase', noRng)).toBe(1);
  });
});

describe('advancePlayer', () => {
  // 26: peak — mid morale holds, high increases every 2 games, low decreases every 4.
  const player = { id: 'p', age: 26, strength: 37, strengthProgressGames: 0 };

  it('only counts the game until the interval is reached', () => {
    expect(advancePlayer(player, 80, band, noRng)).toEqual({
      ...player,
      strengthProgressGames: 1,
    });
    expect(advancePlayer({ ...player, strengthProgressGames: 2 }, 50, band, noRng)).toEqual({
      ...player,
      strengthProgressGames: 3,
    });
  });

  it('applies the change and resets the counter on reaching the interval', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 1 }, 80, band, fixedRng(1))).toEqual({
      ...player,
      strength: 38,
      strengthProgressGames: 0,
    });
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 30, band, noRng)).toEqual({
      ...player,
      strength: 36,
      strengthProgressGames: 0,
    });
  });

  it('resets the counter on a hold', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 50, band, noRng)).toEqual({
      ...player,
      strengthProgressGames: 0,
    });
  });

  it('resets the counter on a lost roll', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 1 }, 80, band, fixedRng(6))).toEqual({
      ...player,
      strengthProgressGames: 0,
    });
  });

  it('reads morale as it stands, so a counter past a shorter interval applies at once', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 80, band, fixedRng(1))).toEqual({
      ...player,
      strength: 38,
      strengthProgressGames: 0,
    });
  });

  it('keeps raising a developing player at mid morale', () => {
    const young = { ...player, age: 19, strengthProgressGames: 2 };
    expect(advancePlayer(young, 50, band, fixedRng(1))).toEqual({
      ...young,
      strength: 38,
      strengthProgressGames: 0,
    });
  });

  it('lowers a veteran whatever the morale', () => {
    const veteran = { ...player, age: 35, strengthProgressGames: 2 };
    expect(advancePlayer(veteran, 100, band, noRng).strength).toBe(36);
  });

  it('pulls a player outside the band toward it whatever the morale and age', () => {
    const relegated = { ...player, age: 31, strength: 60, strengthProgressGames: 3 };
    expect(advancePlayer(relegated, 50, band, noRng).strength).toBe(58);
  });
});
