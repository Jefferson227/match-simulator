export const FULL_STAMINA = 100;
export const MINIMUM_STAMINA = 1;

type StaminaBand = {
  maxAge: number;
  ticksPerPoint: number;
};

// Ordered by age. The first band whose `maxAge` the player has not passed wins.
// These ratios are the contract; see wiki/specs/player-stamina.md for why they
// override the source spec's per-match column.
const STAMINA_BANDS: StaminaBand[] = [
  { maxAge: 20, ticksPerPoint: 15 },
  { maxAge: 25, ticksPerPoint: 13 },
  { maxAge: 28, ticksPerPoint: 10 },
  { maxAge: 32, ticksPerPoint: 6 },
  { maxAge: 35, ticksPerPoint: 4 },
  { maxAge: 38, ticksPerPoint: 3 },
];

const OLDEST_BAND_TICKS_PER_POINT = 2;

export function getStaminaDecayInterval(age: number): number {
  const band = STAMINA_BANDS.find((candidate) => age <= candidate.maxAge);
  return band ? band.ticksPerPoint : OLDEST_BAND_TICKS_PER_POINT;
}

// Derived from the minute rather than accumulated from the previous value, so a
// tick replayed after a save reload cannot drift or double-count.
export function getStaminaAtMinute(age: number, minute: number): number {
  const lost = Math.floor((minute + 1) / getStaminaDecayInterval(age));
  return Math.max(MINIMUM_STAMINA, Math.min(FULL_STAMINA, FULL_STAMINA - lost));
}
