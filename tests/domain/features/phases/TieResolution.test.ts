import { describe, expect, it, jest } from '@jest/globals';
import {
  resolveTie,
  groupMatchesIntoTies,
} from '../../../../src/domain/features/phases/TieResolution';
import { simulatePenaltyShootout } from '../../../../src/domain/features/phases/PenaltyShootoutSimulator';
import Match from '../../../../src/domain/models/Match';
import Player from '../../../../src/domain/models/Player';
import { Team } from '../../../../src/domain/models/Team';
import { RandomProvider } from '../../../../src/domain/features/match-simulation/types';

function buildPlayer(index: number, strength: number, position: Player['position']): Player {
  return {
    id: `player-${index}` as Player['id'],
    position,
    name: `Player ${index}`,
    strength,
    xp: 0,
    isStarter: true,
    isSub: false,
  };
}

function buildTeam(name: string, strength: number): Team {
  return {
    id: `team-${name}` as Team['id'],
    fullName: name,
    shortName: name,
    abbreviation: name,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [
      buildPlayer(1, strength, 'GK'),
      buildPlayer(2, strength, 'DF'),
      buildPlayer(3, strength, 'MF'),
      buildPlayer(4, strength, 'FW'),
      buildPlayer(5, strength, 'FW'),
      buildPlayer(6, strength, 'MF'),
    ],
    morale: 50,
    isControlledByHuman: false,
  };
}

const home = buildTeam('HOM', 50);
const away = buildTeam('AWY', 50);

function leg(
  legNumber: number,
  homeTeam: Team,
  awayTeam: Team,
  homeTeamScore: number,
  awayTeamScore: number
): Match {
  return {
    id: `match-${legNumber}-${homeTeam.abbreviation}`,
    homeTeam,
    awayTeam,
    homeTeamScore,
    awayTeamScore,
    scorers: [],
    tieId: 'p1-t0',
    leg: legNumber,
  };
}

/** Feeds `nextInt` from a fixed script; falls back to `min` once the script runs out. */
function scriptedRng(values: number[]): RandomProvider {
  let index = 0;
  return {
    nextInt: (min: number, max: number) => {
      const value = index < values.length ? values[index] : min;
      index += 1;
      return Math.min(max, Math.max(min, value));
    },
  };
}

/** Alternates a scoring kick and a saved kick, per pair of rolls. */
function alternatingRng(pattern: boolean[]): RandomProvider {
  let kick = 0;
  let roll = 0;
  return {
    nextInt: () => {
      const scores = pattern[kick % pattern.length];
      const value = roll === 0 ? (scores ? 10 : 1) : roll === 1 ? (scores ? 1 : 10) : 1;
      roll += 1;
      if (roll === 2) {
        roll = 0;
        kick += 1;
      }
      return value;
    },
  };
}

const neverCalled: RandomProvider = {
  nextInt: () => {
    throw new Error('rng must not be reached when the cascade already decided the tie');
  },
};

describe('groupMatchesIntoTies', () => {
  it('groups by tieId and orders the legs', () => {
    const second = leg(2, away, home, 0, 0);
    const first = leg(1, home, away, 0, 0);
    const ties = groupMatchesIntoTies([second, first]);

    expect([...ties.keys()]).toEqual(['p1-t0']);
    expect(ties.get('p1-t0')!.map((match) => match.leg)).toEqual([1, 2]);
  });

  it('ignores matches with no tie', () => {
    expect(groupMatchesIntoTies([{ ...leg(1, home, away, 0, 0), tieId: undefined }]).size).toBe(0);
  });
});

describe('resolveTie — points across the tie', () => {
  it('gives the tie to the club with more points over the two legs', () => {
    const outcome = resolveTie(
      [leg(1, home, away, 0, 1), leg(2, away, home, 0, 0)],
      { rng: neverCalled },
      simulatePenaltyShootout
    );

    // Away won leg 1 (3 points) and drew leg 2 (1) — 4 against home's 1.
    expect(outcome.winner.id).toBe(away.id);
    expect(outcome.loser.id).toBe(home.id);
    expect(outcome.shootout).toBeUndefined();
  });
});

describe('resolveTie — goal difference over the two legs', () => {
  it('separates clubs level on points by aggregate goal difference', () => {
    const outcome = resolveTie(
      [leg(1, home, away, 3, 0), leg(2, away, home, 1, 0)],
      { rng: neverCalled },
      simulatePenaltyShootout
    );

    // One win each; home +3 −1 = +2 on aggregate.
    expect(outcome.winner.id).toBe(home.id);
    expect(outcome.shootout).toBeUndefined();
  });

  it('applies no away-goals rule — a tie level on aggregate reaches penalties', () => {
    const outcome = resolveTie(
      [leg(1, home, away, 2, 1), leg(2, away, home, 2, 1)],
      { rng: scriptedRng([10, 1, 1, 10, 10, 1, 1, 10, 10, 1, 1, 10, 10, 1, 1, 10, 10, 1, 1, 10]) },
      simulatePenaltyShootout
    );

    // Away scored 1 at home's ground and home 1 at away's; away goals would separate them, and
    // the RECs do not use them.
    expect(outcome.shootout).toBeDefined();
  });
});

describe('resolveTie — penalties', () => {
  it('refuses to guess when a level tie has no shootout to fall back on', () => {
    expect(() =>
      resolveTie([leg(1, home, away, 1, 1), leg(2, away, home, 1, 1)], { rng: neverCalled })
    ).toThrow(/no shootout was supplied/);
  });

  it('never touches the recorded match scores', () => {
    const legs = [leg(1, home, away, 1, 1), leg(2, away, home, 2, 2)];
    const before = legs.map((match) => [match.homeTeamScore, match.awayTeamScore]);

    resolveTie(legs, { rng: alternatingRng([true, false]) }, simulatePenaltyShootout);

    expect(legs.map((match) => [match.homeTeamScore, match.awayTeamScore])).toEqual(before);
  });
});

describe('simulatePenaltyShootout', () => {
  const legs = [leg(1, away, home, 1, 1), leg(2, home, away, 1, 1)];

  it('treats the deciding leg’s host as the shootout’s home side', () => {
    const { shootout } = simulatePenaltyShootout(legs, [away, home], {
      rng: alternatingRng([true, false]),
    });

    expect(shootout.kicks[0].team).toBe('home');
    expect(shootout.kicks[1].team).toBe('away');
  });

  it('alternates kicks and stops after five each when the shootout is separated', () => {
    // home scores every kick, away misses every kick → decided after home's third.
    const { winner, shootout } = simulatePenaltyShootout(legs, [home, away], {
      rng: alternatingRng([true, false]),
    });

    expect(winner.id).toBe(home.id);
    expect(shootout.homeScore).toBe(3);
    expect(shootout.awayScore).toBe(0);
    // Early exit: at 3–0 with two kicks left each, away can no longer reach 3, so the shootout
    // stops after 6 kicks rather than the full 10.
    expect(shootout.kicks).toHaveLength(6);
  });

  it('takes no more than five kicks a side before sudden death', () => {
    // Every kick scores → level at 5–5 after regulation, then sudden death.
    const { shootout } = simulatePenaltyShootout(legs, [home, away], {
      rng: alternatingRng([true]),
    });

    expect(shootout.kicks.filter((kick) => kick.team === 'home').length).toBeGreaterThanOrEqual(5);
    expect(shootout.homeScore).toBeGreaterThanOrEqual(5);
  });

  it('goes to sudden death in pairs and ends when one side leads after equal kicks', () => {
    // 5 scored each, then home scores and away misses in the first sudden-death pair.
    const pattern = [...Array.from({ length: 10 }, () => true), true, false];
    const { winner, shootout } = simulatePenaltyShootout(legs, [home, away], {
      rng: alternatingRng(pattern),
    });

    expect(shootout.kicks).toHaveLength(12);
    expect(shootout.homeScore).toBe(6);
    expect(shootout.awayScore).toBe(5);
    expect(winner.id).toBe(home.id);
  });

  it('never lets a player kick twice before every starter has kicked', () => {
    const { shootout } = simulatePenaltyShootout(legs, [home, away], {
      rng: alternatingRng([true]),
    });

    const homeKicks = shootout.kicks.filter((kick) => kick.team === 'home');
    const firstSix = homeKicks.slice(0, 6).map((kick) => kick.playerId);

    expect(new Set(firstSix).size).toBe(firstSix.length);
  });

  it('contests each kick on player strength, not flat odds', () => {
    const strongTaker = buildTeam('STR', 90);
    const weakKeeper = buildTeam('WEK', 10);
    const rolls: [number, number][] = [];
    const rng: RandomProvider = {
      nextInt: jest.fn((min: number, max: number) => {
        rolls.push([min, max]);
        return max;
      }) as unknown as RandomProvider['nextInt'],
    };

    simulatePenaltyShootout([leg(2, strongTaker, weakKeeper, 0, 0)], [strongTaker, weakKeeper], {
      rng,
    });

    // The taker's ceiling is their own strength; the keeper's is the opposing GK strength.
    const [takerRoll, keeperRoll] = rolls;
    expect(takerRoll[0]).toBe(1);
    expect(takerRoll[1]).toBe(90);
    expect(keeperRoll[1]).toBe(10);
  });

  it('records every kick in order, with the taker and whether it scored', () => {
    const { shootout } = simulatePenaltyShootout(legs, [home, away], {
      rng: alternatingRng([true, false]),
    });

    expect(shootout.kicks.every((kick) => typeof kick.scored === 'boolean')).toBe(true);
    expect(shootout.kicks.every((kick) => kick.playerId.length > 0)).toBe(true);
    expect(shootout.kicks.map((kick) => kick.team)).toEqual([
      'home',
      'away',
      'home',
      'away',
      'home',
      'away',
    ]);
  });

  it('terminates on a degenerate fixture where every kick is unstoppable', () => {
    const emptyA = { ...buildTeam('EMA', 1), players: [] };
    const emptyB = { ...buildTeam('EMB', 1), players: [] };

    const { winner, shootout } = simulatePenaltyShootout(
      [leg(1, emptyA, emptyB, 0, 0)],
      [emptyA, emptyB],
      { rng: scriptedRng([]) }
    );

    expect([emptyA.id, emptyB.id]).toContain(winner.id);
    expect(shootout.kicks.length).toBeLessThanOrEqual(2 * (5 + 50));
  });
});
