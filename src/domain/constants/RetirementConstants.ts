/**
 * The rules of season ageing and retirement (MS-113). The spec is
 * `wiki/specs/player-retirement.md`.
 */

export type RetirementBand = {
  /** The oldest age the band covers, inclusive. The last band is open-ended. */
  maxAge: number;
  /** Chance of retiring, in percent. */
  chance: number;
};

/** Ordered youngest first; the first band whose `maxAge` is not below the age applies. */
export const PLAYER_RETIREMENT_BANDS: RetirementBand[] = [
  { maxAge: 30, chance: 0.5 },
  { maxAge: 34, chance: 10 },
  { maxAge: 38, chance: 40 },
  { maxAge: 42, chance: 60 },
  { maxAge: Infinity, chance: 80 },
];

export const COACH_RETIREMENT_BANDS: RetirementBand[] = [
  { maxAge: 45, chance: 0.5 },
  { maxAge: 60, chance: 10 },
  { maxAge: 65, chance: 40 },
  { maxAge: 70, chance: 60 },
  { maxAge: Infinity, chance: 80 },
];

/** Chance, in percent, that a retiring player goes into the coach pool. */
export const PLAYER_TO_COACH_CHANCE = 3;

/** Inclusive age range of the player generated to replace a retiree. */
export const YOUTH_AGE_RANGE: [number, number] = [17, 20];

/** Inclusive age range of the coach generated to replace a retired club coach. */
export const REPLACEMENT_COACH_AGE_RANGE: [number, number] = [45, 50];

/** Strength taken off a generated youth player, relative to the squad they join. Invented. */
export const YOUTH_STRENGTH_PENALTY = 10;

/** Chance, in percent, that a generated player is known by a nickname alone. */
export const NICKNAME_CHANCE = 20;

/** Chance, in percent, that a coach generated for a women's club is a woman. */
export const WOMENS_COACH_FEMALE_CHANCE = 50;

/** Nationality of every generated player and coach. Invented. */
export const REPLACEMENT_NATIONALITY = 'BRA';
