import { describe, expect, it } from '@jest/globals';
import {
  BracketEntrant,
  bracketSeedOrder,
  buildKnockoutPhaseRounds,
  buildTies,
  reseedOnAccumulatedPoints,
  resolveSecondLegHost,
} from '../../../../src/domain/features/fixture-generation/KnockoutBracket';
import { GroupSlot, KnockoutPhase } from '../../../../src/domain/models/ChampionshipPhase';
import Standing from '../../../../src/domain/models/Standing';
import { Team } from '../../../../src/domain/models/Team';

function buildTeam(index: number): Team {
  return {
    id: `team-${index}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${String(index).padStart(2, '0')}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  };
}

function standing(team: Team, points: number, goalsFor = 0, goalsAgainst = 0): Standing {
  return { team, position: 1, wins: 0, draws: 0, losses: 0, goalsFor, goalsAgainst, points };
}

/** Eight entrants seeded 1..8, as A1/A2 arrive at the quarter-finals. */
function tableEntrants(count = 8): BracketEntrant[] {
  return Array.from({ length: count }, (_, index) => ({
    team: buildTeam(index + 1),
    seed: index + 1,
  }));
}

/** Sixteen entrants, two per group, as A3 arrives at the round of 16. */
function groupEntrants(): BracketEntrant[] {
  const entrants: BracketEntrant[] = [];
  let seed = 1;
  for (let group = 0; group < 8; group++) {
    for (let groupPosition = 1; groupPosition <= 2; groupPosition++) {
      entrants.push({
        team: buildTeam(group * 10 + groupPosition),
        seed: seed++,
        group,
        groupPosition,
      });
    }
  }
  return entrants;
}

const quarterFinals: KnockoutPhase = {
  kind: 'knockout',
  name: 'Quartas de Final',
  numberOfTies: 4,
  legs: 2,
  secondLegHost: 'higher-seed',
  tiebreakers: ['goal-difference', 'penalties'],
};

const roundOf16: KnockoutPhase = {
  kind: 'knockout',
  name: 'Oitavas de Final',
  numberOfTies: 8,
  legs: 2,
  secondLegHost: 'group-winner',
  tiebreakers: ['goal-difference', 'penalties'],
};

const final: KnockoutPhase = {
  kind: 'knockout',
  name: 'Final',
  numberOfTies: 1,
  legs: 2,
  secondLegHost: 'accumulated-points',
  tiebreakers: ['goal-difference', 'penalties'],
};

function pairSeeds(ties: ReturnType<typeof buildTies>) {
  return ties.map((tie) => [tie.firstLegHost.seed, tie.secondLegHost.seed].sort((a, b) => a - b));
}

describe('bracketSeedOrder', () => {
  it('produces the standard order for 8 seeds', () => {
    expect(bracketSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it('produces the standard order for 4 and 2 seeds', () => {
    expect(bracketSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(bracketSeedOrder(2)).toEqual([1, 2]);
  });
});

describe('buildTies — table seeding (A1 Art. 19, A2 Art. 18)', () => {
  it('pairs 1º×8º, 2º×7º, 3º×6º and 4º×5º', () => {
    const ties = buildTies(tableEntrants(), quarterFinals, 'table', 1);

    expect(ties).toHaveLength(4);
    expect(pairSeeds(ties).sort((a, b) => a[0] - b[0])).toEqual([
      [1, 8],
      [2, 7],
      [3, 6],
      [4, 5],
    ]);
  });

  it('orders the ties so the top two seeds can only meet in the final', () => {
    const ties = buildTies(tableEntrants(), quarterFinals, 'table', 1);
    // Adjacent ties feed the same semifinal; seeds 1 and 2 must not be adjacent.
    expect(pairSeeds(ties)).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
  });

  it('rejects a field that does not fill the declared ties', () => {
    expect(() => buildTies(tableEntrants(6), quarterFinals, 'table', 1)).toThrow(
      /expects 8 clubs for 4 ties; received 6/
    );
  });
});

describe('buildTies — group seeding (A3 Art. 14)', () => {
  it('builds eight ties from the two qualifiers of each of eight groups', () => {
    const ties = buildTies(groupEntrants(), roundOf16, 'groups', 1);
    expect(ties).toHaveLength(8);
  });

  it('never repeats a group-stage fixture', () => {
    for (const tie of buildTies(groupEntrants(), roundOf16, 'groups', 1)) {
      expect(tie.firstLegHost.group).not.toBe(tie.secondLegHost.group);
    }
  });

  it('puts exactly one group winner in every tie, so group-winner hosting is unambiguous', () => {
    for (const tie of buildTies(groupEntrants(), roundOf16, 'groups', 1)) {
      const winners = [tie.firstLegHost, tie.secondLegHost].filter(
        (entrant) => entrant.groupPosition === 1
      );
      expect(winners).toHaveLength(1);
    }
  });

  it('uses every qualifier exactly once', () => {
    const ties = buildTies(groupEntrants(), roundOf16, 'groups', 1);
    const ids = ties.flatMap((tie) => [tie.firstLegHost.team.id, tie.secondLegHost.team.id]);

    expect(new Set(ids).size).toBe(16);
  });
});

describe('resolveSecondLegHost', () => {
  const better: BracketEntrant = { team: buildTeam(1), seed: 2, groupPosition: 2 };
  const worse: BracketEntrant = { team: buildTeam(2), seed: 5, groupPosition: 1 };

  it('higher-seed picks the better-placed club regardless of group', () => {
    expect(resolveSecondLegHost(better, worse, 'higher-seed')).toBe(better);
    expect(resolveSecondLegHost(worse, better, 'higher-seed')).toBe(better);
  });

  it('group-winner picks the group winner even when it is the worse seed', () => {
    expect(resolveSecondLegHost(better, worse, 'group-winner')).toBe(worse);
    expect(resolveSecondLegHost(worse, better, 'group-winner')).toBe(worse);
  });

  it('group-winner falls back to the seed when neither or both won a group', () => {
    const a: BracketEntrant = { team: buildTeam(3), seed: 3, groupPosition: 2 };
    const b: BracketEntrant = { team: buildTeam(4), seed: 6, groupPosition: 2 };
    expect(resolveSecondLegHost(a, b, 'group-winner')).toBe(a);
  });

  it('accumulated-points picks the club with more points across every phase, not the better seed', () => {
    const lowSeedManyPoints: BracketEntrant = {
      team: buildTeam(5),
      seed: 7,
      accumulated: standing(buildTeam(5), 40),
    };
    const topSeedFewPoints: BracketEntrant = {
      team: buildTeam(6),
      seed: 1,
      accumulated: standing(buildTeam(6), 31),
    };

    expect(resolveSecondLegHost(topSeedFewPoints, lowSeedManyPoints, 'accumulated-points')).toBe(
      lowSeedManyPoints
    );
  });

  it('accumulated-points breaks a points tie on goal difference', () => {
    const teamA = buildTeam(7);
    const teamB = buildTeam(8);
    const a: BracketEntrant = { team: teamA, seed: 4, accumulated: standing(teamA, 30, 20, 5) };
    const b: BracketEntrant = { team: teamB, seed: 1, accumulated: standing(teamB, 30, 20, 12) };

    expect(resolveSecondLegHost(b, a, 'accumulated-points')).toBe(a);
  });

  it('accumulated-points falls back to the seed when no accumulated table exists', () => {
    const a: BracketEntrant = { team: buildTeam(9), seed: 2 };
    const b: BracketEntrant = { team: buildTeam(10), seed: 3 };
    expect(resolveSecondLegHost(b, a, 'accumulated-points')).toBe(a);
  });
});

describe('buildKnockoutPhaseRounds', () => {
  it('generates numberOfTies × 2 matches across two rounds', () => {
    const { rounds } = buildKnockoutPhaseRounds(tableEntrants(), quarterFinals, 'table', 1, 18);

    expect(rounds).toHaveLength(2);
    expect(rounds.flatMap((round) => round.matches)).toHaveLength(8);
    expect(rounds.map((round) => round.number)).toEqual([18, 19]);
    expect(rounds.every((round) => round.phaseName === 'Quartas de Final')).toBe(true);
    expect(rounds.every((round) => round.phaseIndex === 1)).toBe(true);
  });

  it('reverses home and away between the legs of every tie', () => {
    const { rounds } = buildKnockoutPhaseRounds(tableEntrants(), quarterFinals, 'table', 1, 18);
    const [firstLeg, secondLeg] = rounds;

    for (let i = 0; i < firstLeg.matches.length; i++) {
      expect(secondLeg.matches[i].homeTeam.id).toBe(firstLeg.matches[i].awayTeam.id);
      expect(secondLeg.matches[i].awayTeam.id).toBe(firstLeg.matches[i].homeTeam.id);
      expect(secondLeg.matches[i].tieId).toBe(firstLeg.matches[i].tieId);
    }
  });

  it('tags both legs of a tie with the same tieId and their leg number', () => {
    const { rounds, ties } = buildKnockoutPhaseRounds(
      tableEntrants(),
      quarterFinals,
      'table',
      1,
      18
    );

    expect(new Set(rounds.flatMap((r) => r.matches).map((m) => m.tieId)).size).toBe(ties.length);
    expect(ties.map((tie) => tie.id)).toEqual(['p1-t0', 'p1-t1', 'p1-t2', 'p1-t3']);
    expect(rounds[0].matches.every((match) => match.leg === 1)).toBe(true);
    expect(rounds[1].matches.every((match) => match.leg === 2)).toBe(true);
  });

  it('gives the second leg to the club the hosting rule picked', () => {
    const { rounds, ties } = buildKnockoutPhaseRounds(
      tableEntrants(),
      quarterFinals,
      'table',
      1,
      18
    );

    for (let i = 0; i < ties.length; i++) {
      expect(rounds[1].matches[i].homeTeam.id).toBe(ties[i].secondLegHost.team.id);
      expect(rounds[0].matches[i].homeTeam.id).toBe(ties[i].firstLegHost.team.id);
      // higher-seed: the better-placed club hosts the decisive leg.
      expect(ties[i].secondLegHost.seed).toBeLessThan(ties[i].firstLegHost.seed);
    }
  });

  it('gives A3 the group winner at home in the second leg of the round of 16', () => {
    const { rounds } = buildKnockoutPhaseRounds(groupEntrants(), roundOf16, 'groups', 1, 7);

    expect(rounds.map((round) => round.number)).toEqual([7, 8]);
    for (const match of rounds[1].matches) {
      expect(match.homeTeam.id).toMatch(/team-\d*1$/);
    }
  });

  it('produces a single round for a one-legged phase', () => {
    const singleLeg: KnockoutPhase = { ...final, legs: 1 };
    const { rounds } = buildKnockoutPhaseRounds(tableEntrants(2), singleLeg, 'table', 3, 40);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].matches).toHaveLength(1);
    expect(rounds[0].matches[0].leg).toBe(1);
  });

  it('keeps the bracket path: adjacent ties feed the same next-phase tie', () => {
    const semifinalists: BracketEntrant[] = [1, 4, 2, 3].map((seed) => ({
      team: buildTeam(seed),
      seed,
    }));
    const semifinal: KnockoutPhase = { ...final, name: 'Semifinal', numberOfTies: 2 };
    const { ties } = buildKnockoutPhaseRounds(semifinalists, semifinal, 'bracket', 2, 20);

    expect(pairSeeds(ties)).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });
});

/**
 * Série D 2025's 2ª Fase, as REC D Anexo B prints it: groups paired A-1/A-2 … A-7/A-8, each pair
 * giving 1ºx×4ºy, 2ºy×3ºx, 1ºy×4ºx, 2ºx×3ºy (B-1…B-16), zero-based groups.
 */
function serieDSecondPhaseCrossings(): [GroupSlot, GroupSlot][] {
  const pairs: [GroupSlot, GroupSlot][] = [];
  for (let x = 0; x < 8; x += 2) {
    const y = x + 1;
    pairs.push(
      [
        { group: x, position: 1 },
        { group: y, position: 4 },
      ],
      [
        { group: y, position: 2 },
        { group: x, position: 3 },
      ],
      [
        { group: y, position: 1 },
        { group: x, position: 4 },
      ],
      [
        { group: x, position: 2 },
        { group: y, position: 3 },
      ]
    );
  }
  return pairs;
}

/** 32 qualifiers, 4 per group, seeded winners-first as `qualifiersFromRoundRobin` does. */
function fourPerGroupEntrants(): BracketEntrant[] {
  const entrants: BracketEntrant[] = [];
  for (let groupPosition = 1; groupPosition <= 4; groupPosition++) {
    for (let group = 0; group < 8; group++) {
      entrants.push({
        team: buildTeam(group * 10 + groupPosition),
        seed: entrants.length + 1,
        group,
        groupPosition,
      });
    }
  }
  return entrants;
}

const serieDSecondPhase: KnockoutPhase = {
  kind: 'knockout',
  name: '2ª Fase',
  numberOfTies: 16,
  legs: 2,
  secondLegHost: 'group-winner',
  tiebreakers: ['goal-difference', 'penalties'],
  crossings: { from: 'group-position', pairs: serieDSecondPhaseCrossings() },
};

/** C-1…C-8 = W(B1)×W(B6), W(B2)×W(B5), W(B3)×W(B8), W(B4)×W(B7), repeated for B9–B16. */
const serieDThirdPhase: KnockoutPhase = {
  kind: 'knockout',
  name: '3ª Fase',
  numberOfTies: 8,
  legs: 2,
  secondLegHost: 'accumulated-points',
  tiebreakers: ['goal-difference', 'penalties'],
  crossings: {
    from: 'previous-ties',
    pairs: [
      [0, 5],
      [1, 4],
      [2, 7],
      [3, 6],
      [8, 13],
      [9, 12],
      [10, 15],
      [11, 14],
    ],
  },
};

const slot = (entrant: BracketEntrant) => `${entrant.group}:${entrant.groupPosition}`;

describe('buildTies — group-position crossings (REC D Art. 17, Anexo B)', () => {
  const ties = buildTies(fourPerGroupEntrants(), serieDSecondPhase, 'crossings', 1);

  it('builds the 16 ties exactly as declared, in declared order', () => {
    const declared = serieDSecondPhaseCrossings().map((pair) =>
      pair.map((groupSlot) => `${groupSlot.group}:${groupSlot.position}`).sort()
    );

    expect(ties.map((tie) => [slot(tie.firstLegHost), slot(tie.secondLegHost)].sort())).toEqual(
      declared
    );
    expect(ties.map((tie) => tie.id)).toEqual(Array.from({ length: 16 }, (_, i) => `p1-t${i}`));
  });

  it('opens with B-1 = 1º A-1 × 4º A-2 and B-2 = 2º A-2 × 3º A-1', () => {
    expect([ties[0].firstLegHost, ties[0].secondLegHost].map(slot).sort()).toEqual(['0:1', '1:4']);
    expect([ties[1].firstLegHost, ties[1].secondLegHost].map(slot).sort()).toEqual(['0:3', '1:2']);
  });

  it('gives the second leg to the 1º/2º club of every tie (REC D Art. 21 §1)', () => {
    for (const tie of ties) {
      expect(tie.secondLegHost.groupPosition).toBeLessThanOrEqual(2);
      expect(tie.firstLegHost.groupPosition).toBeGreaterThanOrEqual(3);
    }
  });

  it('uses every qualifier exactly once', () => {
    const ids = ties.flatMap((tie) => [tie.firstLegHost.team.id, tie.secondLegHost.team.id]);
    expect(new Set(ids).size).toBe(32);
  });
});

describe('buildTies — previous-ties crossings (REC D Art. 17, Anexo B)', () => {
  const winners: BracketEntrant[] = Array.from({ length: 16 }, (_, tie) => ({
    team: buildTeam(100 + tie),
    seed: tie + 1,
    fromTie: tie,
  }));

  it('pairs the winners of the declared ties, not adjacent ones', () => {
    const ties = buildTies(winners, serieDThirdPhase, 'crossings', 2);

    expect(
      ties.map((tie) =>
        [tie.firstLegHost.fromTie!, tie.secondLegHost.fromTie!].sort((a, b) => a - b)
      )
    ).toEqual([
      [0, 5],
      [1, 4],
      [2, 7],
      [3, 6],
      [8, 13],
      [9, 12],
      [10, 15],
      [11, 14],
    ]);
  });

  it('throws when a declared tie has no winner among the entrants', () => {
    const missing = winners.map((entrant) =>
      entrant.fromTie === 5 ? { ...entrant, fromTie: undefined } : entrant
    );

    expect(() => buildTies(missing, serieDThirdPhase, 'crossings', 2)).toThrow(
      /names the winner of tie 5, which no entrant holds/
    );
  });

  it('throws when the same slot is named twice', () => {
    const repeated: KnockoutPhase = {
      ...serieDThirdPhase,
      crossings: {
        from: 'previous-ties',
        pairs: [
          [0, 5],
          [5, 4],
          [2, 7],
          [3, 6],
          [8, 13],
          [9, 12],
          [10, 15],
          [11, 14],
        ],
      },
    };

    expect(() => buildTies(winners, repeated, 'crossings', 2)).toThrow(/twice/);
  });

  it('throws when a group-position slot resolves to nobody', () => {
    const noFourths = fourPerGroupEntrants().map((entrant) =>
      entrant.groupPosition === 4 ? { ...entrant, groupPosition: 5 } : entrant
    );

    expect(() => buildTies(noFourths, serieDSecondPhase, 'crossings', 1)).toThrow(
      /group 1 position 4, which no entrant holds/
    );
  });

  it('throws when a phase seeded by crossings declares none', () => {
    const { crossings: _dropped, ...plain } = serieDThirdPhase;
    expect(() => buildTies(winners, plain as KnockoutPhase, 'crossings', 2)).toThrow(
      /seeded by crossings but declares none/
    );
  });
});

describe('buildTies — accumulated-points reseed (REC D Art. 18)', () => {
  // The 2025 Bloco: the 3ª Fase winners in tie order, with their accumulated points.
  const bloco: [string, number][] = [
    ['Barra', 36],
    ['Maranhão', 26],
    ['Goiatuba', 29],
    ['ASA', 41],
    ['Santa Cruz', 32],
    ['América-RN', 35],
    ['Inter de Limeira', 38],
    ['Cianorte', 30],
  ];
  const entrants: BracketEntrant[] = bloco.map(([name, points], index) => {
    const team = { ...buildTeam(200 + index), shortName: name };
    return { team, seed: index + 1, fromTie: index, accumulated: standing(team, points) };
  });
  const quartas: KnockoutPhase = {
    ...quarterFinals,
    reseed: 'accumulated-points',
    tiebreakers: ['goal-difference', 'penalties'],
  };
  const ties = buildTies(entrants, quartas, 'reseed', 3);
  const names = (tie: (typeof ties)[number]) => [
    tie.secondLegHost.team.shortName,
    tie.firstLegHost.team.shortName,
  ];

  it('pairs 1º×8º, 4º×5º, 2º×7º, 3º×6º of the Bloco in bracket order, as 2025 was played', () => {
    expect(ties.map(names)).toEqual([
      ['ASA', 'Maranhão'],
      ['América-RN', 'Santa Cruz'],
      ['Inter de Limeira', 'Goiatuba'],
      ['Barra', 'Cianorte'],
    ]);
  });

  it('renumbers seeds so the better-ranked club hosts the second leg (Art. 18 §1)', () => {
    expect(ties.map((tie) => [tie.secondLegHost.seed, tie.firstLegHost.seed])).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
  });

  it('ranks entrants with an accumulated table ahead of any without one', () => {
    const [first, second] = reseedOnAccumulatedPoints([
      { team: buildTeam(1), seed: 1 },
      { team: buildTeam(2), seed: 2, accumulated: standing(buildTeam(2), 3) },
    ]);
    expect(first.team.id).toBe('team-2');
    expect(second.seed).toBe(2);
  });
});

describe('resolveSecondLegHost — group-winner by better placing (REC D Art. 21 §1)', () => {
  const at = (index: number, seed: number, groupPosition?: number): BracketEntrant => ({
    team: buildTeam(index),
    seed,
    groupPosition,
  });

  it('gives 1º the second leg against 4º, whatever the seeds', () => {
    expect(resolveSecondLegHost(at(1, 20, 4), at(2, 3, 1), 'group-winner').team.id).toBe('team-2');
    expect(resolveSecondLegHost(at(2, 3, 1), at(1, 20, 4), 'group-winner').team.id).toBe('team-2');
  });

  it('gives 2º the second leg against 3º', () => {
    expect(resolveSecondLegHost(at(1, 9, 3), at(2, 12, 2), 'group-winner').team.id).toBe('team-2');
  });

  it('falls back to the seed on equal or unknown placings', () => {
    expect(resolveSecondLegHost(at(1, 7, 3), at(2, 4, 3), 'group-winner').team.id).toBe('team-2');
    expect(resolveSecondLegHost(at(1, 2, 1), at(2, 4), 'group-winner').team.id).toBe('team-1');
  });
});
