import { describe, expect, it } from '@jest/globals';
import {
  MAX_NAME_ATTEMPTS,
  generateName,
} from '../../../../src/domain/features/retirement/NameGenerator';
import {
  FEMALE_FIRST_NAMES,
  FEMALE_NICKNAMES,
  MALE_FIRST_NAMES,
  MALE_NICKNAMES,
  SURNAMES,
} from '../../../../src/domain/constants/GeneratedNames';
import { neverRng, scriptedRng } from '../../../support/retirementRng';

const NO_NICKNAME = 1000;
const NICKNAME = 0;

describe('generateName', () => {
  it('draws a male player First Last from the male list', () => {
    const rng = scriptedRng([NO_NICKNAME, 2, 3]);
    const name = generateName({ gender: 'male', kind: 'player', takenNames: new Set(), rng });
    expect(name).toBe(`${MALE_FIRST_NAMES[2]} ${SURNAMES[3]}`);
  });

  it('draws a female player First Last from the female list', () => {
    const rng = scriptedRng([NO_NICKNAME, 2, 3]);
    const name = generateName({ gender: 'female', kind: 'player', takenNames: new Set(), rng });
    expect(name).toBe(`${FEMALE_FIRST_NAMES[2]} ${SURNAMES[3]}`);
  });

  it('gives a player a nickname alone when the 20% roll succeeds', () => {
    expect(
      generateName({
        gender: 'male',
        kind: 'player',
        takenNames: new Set(),
        rng: scriptedRng([200, 4]),
      })
    ).toBe(MALE_NICKNAMES[4]);
    expect(
      generateName({
        gender: 'female',
        kind: 'player',
        takenNames: new Set(),
        rng: scriptedRng([NICKNAME, 4]),
      })
    ).toBe(FEMALE_NICKNAMES[4]);
  });

  it('does not give a nickname on a roll 0.1 above 20%', () => {
    const rng = scriptedRng([201, 0, 0]);
    const name = generateName({ gender: 'male', kind: 'player', takenNames: new Set(), rng });
    expect(name).toBe(`${MALE_FIRST_NAMES[0]} ${SURNAMES[0]}`);
  });

  it('never gives a coach a nickname and never rolls for one', () => {
    // A coach draws first name and surname straight away: the scripted 0 is the first-name index.
    const rng = scriptedRng([0, 5]);
    const name = generateName({ gender: 'male', kind: 'coach', takenNames: new Set(), rng });
    expect(name).toBe(`${MALE_FIRST_NAMES[0]} ${SURNAMES[5]}`);
    expect(rng.remaining()).toBe(0);
  });

  it('draws again while the name is taken', () => {
    const taken = new Set([`${MALE_FIRST_NAMES[0]} ${SURNAMES[0]}`]);
    const rng = scriptedRng([0, 0, 1, 1]);
    expect(generateName({ gender: 'male', kind: 'coach', takenNames: taken, rng })).toBe(
      `${MALE_FIRST_NAMES[1]} ${SURNAMES[1]}`
    );
  });

  it('falls back to the first taken draw once the attempts run out', () => {
    // neverRng always picks the last entry of each list, so every attempt draws the same name.
    const same = `${MALE_FIRST_NAMES.at(-1)} ${SURNAMES.at(-1)}`;
    const name = generateName({
      gender: 'male',
      kind: 'coach',
      takenNames: new Set([same]),
      rng: neverRng,
    });
    expect(name).toBe(same);
  });

  it('never returns the name it must avoid, even after the attempts run out', () => {
    const same = `${MALE_FIRST_NAMES.at(-1)} ${SURNAMES.at(-1)}`;
    let calls = 0;
    const counting = {
      nextInt: (min: number, max: number) => {
        calls++;
        return neverRng.nextInt(min, max);
      },
    };
    const name = generateName({
      gender: 'male',
      kind: 'coach',
      takenNames: new Set([same]),
      avoidName: same,
      rng: counting,
    });
    expect(name).not.toBe(same);
    expect(name).toBe(`${MALE_FIRST_NAMES[0]} ${SURNAMES[0]}`);
    expect(calls).toBe(MAX_NAME_ATTEMPTS * 2);
  });
});
