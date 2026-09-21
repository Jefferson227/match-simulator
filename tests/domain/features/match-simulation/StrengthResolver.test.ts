import { describe, expect, it } from '@jest/globals';
import {
  getDefenseStrengthForDispute,
  getEffectiveStrength,
  getShooterStrengthForDispute,
  getTeamStrengthForDispute,
} from '../../../../src/domain/features/match-simulation/StrengthResolver';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';

// Morale 50 is the neutral point: applyMorale multiplies by 1, so these tests
// read the stamina multiplier without the morale one on top of it.
const NEUTRAL_MORALE = 50;

function buildPlayer(overrides: Partial<Player> & Pick<Player, 'strength'>): Player {
  return {
    id: 'player-1-1-1-1' as Player['id'],
    position: 'MF',
    name: 'Player',
    age: 26,
    xp: 0,
    isStarter: true,
    isSub: false,
    ...overrides,
  };
}

function buildTeam(players: Player[], morale = NEUTRAL_MORALE): Team {
  return {
    id: 'team-1-1-1-1' as Team['id'],
    fullName: 'Team',
    shortName: 'TM',
    abbreviation: 'TM',
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players,
    morale,
    isControlledByHuman: false,
  };
}

describe('getEffectiveStrength', () => {
  it('scales strength by stamina without rounding', () => {
    // The ticket's worked example: strength 43 at stamina 99.
    expect(getEffectiveStrength(buildPlayer({ strength: 43, stamina: 99 }))).toBeCloseTo(42.57, 10);
  });

  it('treats an unset stamina as full, so nothing outside a match changes', () => {
    expect(getEffectiveStrength(buildPlayer({ strength: 43 }))).toBe(43);
  });

  it('returns the full strength at stamina 100', () => {
    expect(getEffectiveStrength(buildPlayer({ strength: 80, stamina: 100 }))).toBe(80);
  });
});

describe('getTeamStrengthForDispute', () => {
  it('applies the multiplier per player, before the lineup is summed', () => {
    const team = buildTeam([
      buildPlayer({ id: 'p-1-1-1-1' as Player['id'], strength: 43, stamina: 99 }),
      buildPlayer({ id: 'p-2-2-2-2' as Player['id'], strength: 60, stamina: 50 }),
      buildPlayer({ id: 'p-3-3-3-3' as Player['id'], strength: 20, stamina: 100 }),
    ]);

    // 42.57 + 30 + 20 = 92.57, rounded once at the end by applyMorale.
    expect(getTeamStrengthForDispute(team, 'MF')).toBe(93);
  });

  it('returns full strength when stamina is opted out of', () => {
    const team = buildTeam([
      buildPlayer({ id: 'p-1-1-1-1' as Player['id'], strength: 43, stamina: 1 }),
      buildPlayer({ id: 'p-2-2-2-2' as Player['id'], strength: 60, stamina: 1 }),
    ]);

    expect(getTeamStrengthForDispute(team, 'MF', { applyStamina: false })).toBe(103);
  });

  it('keeps the floor of 1 for a lineup drained to nothing', () => {
    const team = buildTeam([
      buildPlayer({ id: 'p-1-1-1-1' as Player['id'], strength: 1, stamina: 1 }),
    ]);

    expect(getTeamStrengthForDispute(team, 'MF')).toBe(1);
  });

  it('still applies morale on top of stamina', () => {
    const team = buildTeam(
      [buildPlayer({ strength: 100, stamina: 50 })],
      100 // +30%
    );

    // 100 * 0.5 = 50, then * 1.3 = 65.
    expect(getTeamStrengthForDispute(team, 'MF')).toBe(65);
  });
});

describe('getDefenseStrengthForDispute', () => {
  it('tires defenders and the keeper individually', () => {
    const team = buildTeam([
      buildPlayer({ id: 'p-1-1-1-1' as Player['id'], position: 'GK', strength: 50, stamina: 80 }),
      buildPlayer({ id: 'p-2-2-2-2' as Player['id'], position: 'DF', strength: 40, stamina: 50 }),
      buildPlayer({ id: 'p-3-3-3-3' as Player['id'], position: 'FW', strength: 90, stamina: 10 }),
    ]);

    // Only GK and DF count: 40 + 20 = 60.
    expect(getDefenseStrengthForDispute(team)).toBe(60);
  });

  it('returns full strength when stamina is opted out of', () => {
    const team = buildTeam([
      buildPlayer({ id: 'p-1-1-1-1' as Player['id'], position: 'GK', strength: 50, stamina: 1 }),
      buildPlayer({ id: 'p-2-2-2-2' as Player['id'], position: 'DF', strength: 40, stamina: 1 }),
    ]);

    expect(getDefenseStrengthForDispute(team, { applyStamina: false })).toBe(90);
  });
});

describe('getShooterStrengthForDispute', () => {
  it('tires the shooter', () => {
    const shooter = buildPlayer({ strength: 80, stamina: 25 });
    expect(getShooterStrengthForDispute(shooter, buildTeam([shooter]))).toBe(20);
  });

  it('returns full strength when stamina is opted out of', () => {
    const shooter = buildPlayer({ strength: 80, stamina: 25 });
    expect(
      getShooterStrengthForDispute(shooter, buildTeam([shooter]), { applyStamina: false })
    ).toBe(80);
  });
});
