import { describe, expect, it } from '@jest/globals';
import {
  AgeBand,
  MoraleBand,
  advancePlayer,
  getAgeBand,
  getDirection,
  getInterval,
  getMoraleBand,
  getStep,
} from '../../../../src/domain/features/strength-progression/ProgressionPolicy';

const range = { min: 25, max: 49 };

describe('getMoraleBand', () => {
  it.each([
    [0, 'low'],
    [30, 'low'],
    [30.5, 'mid'],
    [50, 'mid'],
    [70, 'mid'],
    [70.5, 'high'],
    [100, 'high'],
  ])('puts morale %p in the %s band', (morale, band) => {
    expect(getMoraleBand(morale)).toBe(band);
  });

  it('decreases only in the low band', () => {
    expect(getDirection('low')).toBe('decrease');
    expect(getDirection('mid')).toBe('increase');
    expect(getDirection('high')).toBe('increase');
  });
});

describe('getAgeBand', () => {
  it.each([
    [15, 'young'],
    [25, 'young'],
    [26, 'prime'],
    [35, 'prime'],
    [36, 'veteran'],
    [44, 'veteran'],
  ])('puts age %p in the %s band', (age, band) => {
    expect(getAgeBand(age)).toBe(band);
  });
});

describe('getInterval', () => {
  it.each([
    ['low', 'young', 3],
    ['low', 'prime', 4],
    ['low', 'veteran', 5],
    ['mid', 'young', 3],
    ['mid', 'prime', 4],
    ['mid', 'veteran', 5],
    ['high', 'young', 1],
    ['high', 'prime', 2],
    ['high', 'veteran', 3],
  ] as [MoraleBand, AgeBand, number][])(
    'is %s morale × %s age → every %p games',
    (morale, age, interval) => {
      expect(getInterval(morale, age)).toBe(interval);
    }
  );
});

describe('getStep', () => {
  describe('increase', () => {
    it('adds 1 inside the range', () => expect(getStep(30, range, 'increase')).toBe(31));
    it('never passes the range max', () => expect(getStep(49, range, 'increase')).toBe(49));
    it('adds 2 below the range', () => expect(getStep(20, range, 'increase')).toBe(22));
    it('may land inside the range from below', () =>
      expect(getStep(24, range, 'increase')).toBe(26));
    it('stays put above the range', () => expect(getStep(60, range, 'increase')).toBe(60));
    it('clamps to 99', () => expect(getStep(98, { min: 99, max: 99 }, 'increase')).toBe(99));
  });

  describe('decrease', () => {
    it('takes 1 inside the range', () => expect(getStep(30, range, 'decrease')).toBe(29));
    it('never passes the range min', () => expect(getStep(25, range, 'decrease')).toBe(25));
    it('takes 2 above the range', () => expect(getStep(60, range, 'decrease')).toBe(58));
    it('may land inside the range from above', () =>
      expect(getStep(50, range, 'decrease')).toBe(48));
    it('stays put below the range', () => expect(getStep(20, range, 'decrease')).toBe(20));
    it('clamps to 1', () => expect(getStep(2, { min: 1, max: 1 }, 'decrease')).toBe(1));
  });
});

describe('advancePlayer', () => {
  const player = { id: 'p', age: 30, strength: 30, strengthProgressGames: 0 };

  it('only counts the game until the interval is reached', () => {
    expect(advancePlayer(player, 50, range)).toEqual({ ...player, strengthProgressGames: 1 });
    expect(advancePlayer({ ...player, strengthProgressGames: 2 }, 50, range)).toEqual({
      ...player,
      strengthProgressGames: 3,
    });
  });

  it('applies the change and resets the counter on reaching the interval', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 50, range)).toEqual({
      ...player,
      strength: 31,
      strengthProgressGames: 0,
    });
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 30, range)).toEqual({
      ...player,
      strength: 29,
      strengthProgressGames: 0,
    });
  });

  it('resets the counter even when the step is zero', () => {
    expect(advancePlayer({ ...player, strength: 49, strengthProgressGames: 3 }, 50, range)).toEqual(
      { ...player, strength: 49, strengthProgressGames: 0 }
    );
  });

  it('reads morale as it stands, so a counter past a shorter interval applies at once', () => {
    expect(advancePlayer({ ...player, strengthProgressGames: 3 }, 80, range)).toEqual({
      ...player,
      strength: 31,
      strengthProgressGames: 0,
    });
  });

  it('changes a young player every game at high morale', () => {
    const young = { ...player, age: 19 };
    const once = advancePlayer(young, 80, range);
    expect(once).toEqual({ ...young, strength: 31, strengthProgressGames: 0 });
    expect(advancePlayer(once, 80, range).strength).toBe(32);
  });
});
