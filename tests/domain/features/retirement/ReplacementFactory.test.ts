import { describe, expect, it } from '@jest/globals';
import {
  createReplacementCoach,
  createYouthPlayer,
  getPlayerGender,
} from '../../../../src/domain/features/retirement/ReplacementFactory';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';
import {
  FEMALE_FIRST_NAMES,
  MALE_FIRST_NAMES,
  SURNAMES,
} from '../../../../src/domain/constants/GeneratedNames';
import { scriptedRng } from '../../../support/retirementRng';

const NO_NICKNAME = 1000;

function player(overrides: Partial<Player>): Player {
  return {
    id: 'a-b-c-d-e',
    position: 'MF',
    name: 'Someone',
    strength: 50,
    age: 30,
    nationalities: ['ARG'],
    xp: 12,
    seasonGames: 0,
    seasonGoals: 0,
    isStarter: true,
    isSub: false,
    ...overrides,
  };
}

function team(players: Player[]): Team {
  return {
    id: 't-e-a-m-1',
    fullName: 'Team',
    shortName: 'Team',
    abbreviation: 'TEA',
    colors: { outline: '#000', background: '#fff', text: '#000' },
    players,
    morale: 50,
    isControlledByHuman: false,
  };
}

describe('createYouthPlayer', () => {
  const retiree = player({ id: 'r-e-t-i-r', position: 'DF', name: 'Old Timer', strength: 90 });
  const squad = team([
    retiree,
    player({ id: 'p-1-1-1-1', strength: 60 }),
    player({ id: 'p-2-2-2-2', strength: 71 }),
  ]);

  it('keeps the position and starts fresh: BRA, no xp, neither starter nor sub', () => {
    const youth = createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([17]));
    expect(youth.position).toBe('DF');
    expect(youth.nationalities).toEqual(['BRA']);
    expect(youth.xp).toBe(0);
    expect(youth.isStarter).toBe(false);
    expect(youth.isSub).toBe(false);
    expect(youth.stamina).toBeUndefined();
  });

  it.each([17, 20])('can be aged %i', (age) => {
    expect(createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([age])).age).toBe(age);
  });

  it('asks for an age between 17 and 20', () => {
    expect(() => createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([16]))).toThrow();
    expect(() => createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([21]))).toThrow();
  });

  it('is 10 weaker than a seed-loader roll around the rest of the squad', () => {
    // The rest of the squad averages round((60 + 71) / 2) = 66, so the roll spans 61..71 and the
    // retiree's own 90 plays no part.
    expect(
      createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([18, 61])).strength
    ).toBe(51);
    expect(
      createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([18, 71])).strength
    ).toBe(61);
    expect(() =>
      createYouthPlayer(retiree, squad, 'male', new Set(), scriptedRng([18, 72]))
    ).toThrow();
  });

  it('never drops below strength 1', () => {
    const weak = team([retiree, player({ id: 'p-1-1-1-1', strength: 3 })]);
    // The roll spans -2..8; its low end minus 10 is clamped.
    expect(
      createYouthPlayer(retiree, weak, 'male', new Set(), scriptedRng([18, -2])).strength
    ).toBe(1);
  });

  it('draws its name from the gendered list', () => {
    const male = createYouthPlayer(
      retiree,
      squad,
      'male',
      new Set(),
      scriptedRng([18, 66, NO_NICKNAME, 1, 2])
    );
    const female = createYouthPlayer(
      retiree,
      squad,
      'female',
      new Set(),
      scriptedRng([18, 66, NO_NICKNAME, 1, 2])
    );
    expect(male.name).toBe(`${MALE_FIRST_NAMES[1]} ${SURNAMES[2]}`);
    expect(female.name).toBe(`${FEMALE_FIRST_NAMES[1]} ${SURNAMES[2]}`);
  });
});

describe('createReplacementCoach', () => {
  it.each([45, 50])('can be aged %i, Brazilian', (age) => {
    const coach = createReplacementCoach('mens', new Set(), scriptedRng([age]));
    expect(coach.age).toBe(age);
    expect(coach.nationalities).toEqual(['BRA']);
  });

  it('asks for an age between 45 and 50', () => {
    expect(() => createReplacementCoach('mens', new Set(), scriptedRng([44]))).toThrow();
    expect(() => createReplacementCoach('mens', new Set(), scriptedRng([51]))).toThrow();
  });

  it('is always a man for a men’s club, with no gender roll', () => {
    const coach = createReplacementCoach('mens', new Set(), scriptedRng([45, 3, 4]));
    expect(coach.name).toBe(`${MALE_FIRST_NAMES[3]} ${SURNAMES[4]}`);
  });

  it('is a woman or a man with even odds for a women’s club', () => {
    const woman = createReplacementCoach('womens', new Set(), scriptedRng([500, 45, 3, 4]));
    const man = createReplacementCoach('womens', new Set(), scriptedRng([501, 45, 3, 4]));
    expect(woman.name).toBe(`${FEMALE_FIRST_NAMES[3]} ${SURNAMES[4]}`);
    expect(man.name).toBe(`${MALE_FIRST_NAMES[3]} ${SURNAMES[4]}`);
  });
});

describe('getPlayerGender', () => {
  it('maps a league type to its players’ gender', () => {
    expect(getPlayerGender('mens')).toBe('male');
    expect(getPlayerGender('womens')).toBe('female');
  });
});
