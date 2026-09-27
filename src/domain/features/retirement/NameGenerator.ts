import { RandomProvider } from '../match-simulation/types';
import { rollChance } from './RetirementPolicy';
import { NICKNAME_CHANCE } from '../../constants/RetirementConstants';
import {
  FEMALE_FIRST_NAMES,
  FEMALE_NICKNAMES,
  MALE_FIRST_NAMES,
  MALE_NICKNAMES,
  SURNAMES,
} from '../../constants/GeneratedNames';

export type Gender = 'male' | 'female';

export type NameKind = 'player' | 'coach';

export type GenerateNameOptions = {
  gender: Gender;
  kind: NameKind;
  /** Names already in use in the pyramid. Avoided for as long as the attempts last. */
  takenNames: ReadonlySet<string>;
  /** The retiree's own name. Always avoided, even once the attempts run out. */
  avoidName?: string;
  rng: RandomProvider;
};

/** How many names are drawn before giving up on avoiding `takenNames`. */
export const MAX_NAME_ATTEMPTS = 20;

const NAME_LISTS: Record<Gender, { firstNames: string[]; nicknames: string[] }> = {
  male: { firstNames: MALE_FIRST_NAMES, nicknames: MALE_NICKNAMES },
  female: { firstNames: FEMALE_FIRST_NAMES, nicknames: FEMALE_NICKNAMES },
};

function pickFrom(list: string[], rng: RandomProvider): string {
  return list[rng.nextInt(0, list.length - 1)];
}

function drawName(gender: Gender, kind: NameKind, rng: RandomProvider): string {
  const lists = NAME_LISTS[gender];
  // A coach is always known by first name and surname; only a player goes by a nickname alone.
  if (kind === 'player' && rollChance(NICKNAME_CHANCE, rng)) return pickFrom(lists.nicknames, rng);
  return `${pickFrom(lists.firstNames, rng)} ${pickFrom(SURNAMES, rng)}`;
}

/**
 * A name for a generated player or coach.
 *
 * Draws up to `MAX_NAME_ATTEMPTS` names looking for one outside `takenNames`. When every attempt is
 * taken — the lists are finite — the first attempt that at least differs from `avoidName` is used,
 * and when even that fails, a fixed first-name/surname pairing unlike `avoidName` is. It never
 * loops without bound.
 */
export function generateName({
  gender,
  kind,
  takenNames,
  avoidName,
  rng,
}: GenerateNameOptions): string {
  let fallback: string | undefined;

  for (let attempt = 0; attempt < MAX_NAME_ATTEMPTS; attempt++) {
    const candidate = drawName(gender, kind, rng);
    if (candidate === avoidName) continue;
    if (!takenNames.has(candidate)) return candidate;
    fallback ??= candidate;
  }

  if (fallback) return fallback;

  const firstName = NAME_LISTS[gender].firstNames[0];
  const surname = SURNAMES.find((candidate) => `${firstName} ${candidate}` !== avoidName);
  return `${firstName} ${surname}`;
}
