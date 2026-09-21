import { describe, expect, it } from '@jest/globals';
import {
  FULL_STAMINA,
  MINIMUM_STAMINA,
  getStaminaAtMinute,
  getStaminaDecayInterval,
} from '../../../../src/domain/features/match-simulation/StaminaPolicy';

const LAST_MINUTE = 89;

describe('getStaminaDecayInterval', () => {
  // Both edges of every band, so a boundary cannot drift by one year unnoticed.
  it.each([
    [16, 15],
    [17, 15],
    [20, 15],
    [21, 13],
    [25, 13],
    [26, 10],
    [28, 10],
    [29, 6],
    [32, 6],
    [33, 4],
    [35, 4],
    [36, 3],
    [38, 3],
    [39, 2],
  ])('at age %i, spends 1 stamina every %i ticks', (age, expectedInterval) => {
    expect(getStaminaDecayInterval(age)).toBe(expectedInterval);
  });

  it('clamps an implausibly young age into the youngest band', () => {
    expect(getStaminaDecayInterval(5)).toBe(15);
  });

  it('keeps the oldest band open-ended', () => {
    expect(getStaminaDecayInterval(60)).toBe(2);
  });
});

describe('getStaminaAtMinute', () => {
  it('starts every age at full stamina on the kickoff tick', () => {
    for (const age of [17, 21, 26, 29, 33, 36, 39]) {
      expect(getStaminaAtMinute(age, 0)).toBe(FULL_STAMINA);
    }
  });

  // The ticket's "lost over 90 ticks" column. These are the numbers the design
  // was argued from, and they are what the ratio table has to reproduce.
  it.each([
    [20, 6],
    [25, 6],
    [28, 9],
    [32, 15],
    [35, 22],
    [38, 30],
    [39, 45],
  ])('at age %i, loses %i stamina over a full match', (age, expectedLoss) => {
    expect(getStaminaAtMinute(age, LAST_MINUTE)).toBe(FULL_STAMINA - expectedLoss);
  });

  it('never drops below the floor, however long the match runs', () => {
    expect(getStaminaAtMinute(39, 10_000)).toBe(MINIMUM_STAMINA);
  });

  it('never exceeds full stamina', () => {
    expect(getStaminaAtMinute(26, -5)).toBe(FULL_STAMINA);
  });

  it('is idempotent — the same minute always yields the same value', () => {
    const first = getStaminaAtMinute(34, 45);
    const second = getStaminaAtMinute(34, 45);
    expect(second).toBe(first);
  });

  it('never recovers as the match runs on', () => {
    let previous = FULL_STAMINA;
    for (let minute = 0; minute <= LAST_MINUTE; minute++) {
      const current = getStaminaAtMinute(30, minute);
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });
});
