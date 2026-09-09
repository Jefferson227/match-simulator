import { describe, expect, it } from '@jest/globals';
import {
  buildRoundRobinRounds,
  createMatches,
  splitIntoGroups,
} from '../../../../src/domain/features/fixture-generation/FixtureGenerator';
import Match from '../../../../src/domain/models/Match';
import Round from '../../../../src/domain/models/Round';
import { Team } from '../../../../src/domain/models/Team';
import { KnockoutPhase, RoundRobinPhase } from '../../../../src/domain/models/ChampionshipPhase';
import { buildKnockoutPhaseRounds } from '../../../../src/domain/features/fixture-generation/KnockoutBracket';

function buildTeams(count: number): Team[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `team-${index}` as Team['id'],
    fullName: `Team ${index}`,
    shortName: `T${index}`,
    abbreviation: `T${index}`,
    colors: { outline: '#000000', background: '#ffffff', text: '#000000' },
    players: [],
    morale: 50,
    isControlledByHuman: false,
  }));
}

/** The pre-MS-103 generator, copied verbatim, to pin the legacy path against. */
function legacyCreateMatches(startingTeams: Team[]) {
  const teams = [...startingTeams];
  const roundsPerLeg = teams.length - 1;
  const matchesPerRound = teams.length / 2;
  const totalRounds = roundsPerLeg * 2;
  const rounds: { number: number; matches: { home: string; away: string }[] }[] = [];
  let roundNumber = 1;

  for (let round = 0; round < roundsPerLeg; round++) {
    const matches: { home: string; away: string }[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      matches.push({ home: teams[i].id, away: teams[teams.length - 1 - i].id });
    }
    rounds.push({ number: roundNumber, matches });
    roundNumber += 1;

    const lastTeam = teams.pop()!;
    teams.splice(1, 0, lastTeam);
  }

  const firstLegRoundsCount = rounds.length;
  for (let i = 0; i < firstLegRoundsCount; i++) {
    const matches = rounds[i].matches.map((match) => ({ home: match.away, away: match.home }));
    rounds.push({ number: roundNumber, matches });
    roundNumber += 1;
  }

  return { totalRounds, rounds };
}

function toPairs(rounds: Round[]) {
  return rounds.map((round) => ({
    number: round.number,
    matches: round.matches.map((match) => ({ home: match.homeTeam.id, away: match.awayTeam.id })),
  }));
}

function allMatches(rounds: Round[]): Match[] {
  return rounds.flatMap((round) => round.matches);
}

describe('FixtureGenerator.createMatches — legacy path', () => {
  it.each([20, 18, 16])(
    'produces fixtures identical to the pre-MS-103 generator for %i clubs',
    (count) => {
      const teams = buildTeams(count);
      const expected = legacyCreateMatches(teams);
      const actual = createMatches(teams);

      expect(actual.totalRounds).toBe(expected.totalRounds);
      expect(toPairs(actual.rounds)).toEqual(expected.rounds);
    }
  );

  it('leaves every round untagged when the championship has no phases', () => {
    const rounds = createMatches(buildTeams(20)).rounds;

    for (const round of rounds) {
      expect(round.phaseIndex).toBeUndefined();
      expect(round.phaseName).toBeUndefined();
      for (const match of round.matches) {
        expect(match.phaseIndex).toBeUndefined();
        expect(match.group).toBeUndefined();
      }
    }
  });

  it('treats an empty phases array as unphased', () => {
    const teams = buildTeams(20);
    expect(toPairs(createMatches(teams, []).rounds)).toEqual(legacyCreateMatches(teams).rounds);
  });
});

describe('FixtureGenerator.buildRoundRobinRounds', () => {
  it('stops after the first leg when legs is 1', () => {
    const teams = buildTeams(18);
    const single = buildRoundRobinRounds(teams, 1);
    const double = buildRoundRobinRounds(teams, 2);

    expect(single).toHaveLength(17);
    expect(double).toHaveLength(34);
    expect(single.flat()).toHaveLength(double.flat().length / 2);
  });

  it('never schedules a club twice in the same round', () => {
    for (const round of buildRoundRobinRounds(buildTeams(16), 2)) {
      const ids = round.flatMap((match) => [match.homeTeam.id, match.awayTeam.id]);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('pairs every club with every other exactly once per leg', () => {
    const rounds = buildRoundRobinRounds(buildTeams(8), 1);
    const pairs = rounds
      .flat()
      .map((match) => [match.homeTeam.id, match.awayTeam.id].sort().join('|'));

    expect(new Set(pairs).size).toBe((8 * 7) / 2);
  });

  it('reverses home and away in the second leg', () => {
    const rounds = buildRoundRobinRounds(buildTeams(8), 2);

    for (let i = 0; i < 7; i++) {
      const first = rounds[i];
      const second = rounds[i + 7];
      expect(second.map((match) => [match.homeTeam.id, match.awayTeam.id])).toEqual(
        first.map((match) => [match.awayTeam.id, match.homeTeam.id])
      );
    }
  });

  it('gives an odd field a bye instead of an overlapping fixture', () => {
    const rounds = buildRoundRobinRounds(buildTeams(7), 1);

    // Seven clubs play seven rounds; one club sits out each round.
    expect(rounds).toHaveLength(7);
    expect(rounds.every((round) => round.length === 3)).toBe(true);

    const pairs = rounds
      .flat()
      .map((match) => [match.homeTeam.id, match.awayTeam.id].sort().join('|'));
    expect(new Set(pairs).size).toBe((7 * 6) / 2);
  });
});

describe('FixtureGenerator.splitIntoGroups', () => {
  it('deals the field into groups in seed order', () => {
    const groups = splitIntoGroups(buildTeams(32), 8, 4);

    expect(groups).toHaveLength(8);
    expect(groups.every((group) => group.length === 4)).toBe(true);
    expect(groups[0].map((team) => team.id)).toEqual(['team-0', 'team-1', 'team-2', 'team-3']);
    expect(groups[7].map((team) => team.id)).toEqual(['team-28', 'team-29', 'team-30', 'team-31']);
  });

  it('spreads a drifted field evenly rather than rejecting it', () => {
    // A3 after one roll-over: 32 clubs become 30, and the group stage must still be playable.
    const groups = splitIntoGroups(buildTeams(30), 8, 4);

    expect(groups).toHaveLength(8);
    expect(groups.map((group) => group.length)).toEqual([4, 4, 4, 4, 4, 4, 3, 3]);
    expect(groups.flat()).toHaveLength(30);
  });

  it('refuses a field too small to give every group two clubs', () => {
    expect(() => splitIntoGroups(buildTeams(15), 8, 4)).toThrow(/at least 2 clubs per group/);
  });
});

describe('FixtureGenerator.createMatches — round-robin phases', () => {
  const a1FirstPhase: RoundRobinPhase = {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 1,
    teamsPerGroup: 18,
    legs: 1,
    advancingPerGroup: 8,
  };

  const a3FirstPhase: RoundRobinPhase = {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 8,
    teamsPerGroup: 4,
    legs: 2,
    advancingPerGroup: 2,
  };

  it('gives A1 17 single-leg rounds rather than 34', () => {
    const container = createMatches(buildTeams(18), [a1FirstPhase]);

    expect(container.totalRounds).toBe(17);
    expect(container.rounds).toHaveLength(17);
    expect(allMatches(container.rounds)).toHaveLength((18 * 17) / 2);
  });

  it('gives A2 15 single-leg rounds rather than 30', () => {
    const container = createMatches(buildTeams(16), [{ ...a1FirstPhase, teamsPerGroup: 16 }]);

    expect(container.totalRounds).toBe(15);
    expect(allMatches(container.rounds)).toHaveLength((16 * 15) / 2);
  });

  it("generates A3's group stage as 8 groups of 12 matches across 6 shared rounds", () => {
    const container = createMatches(buildTeams(32), [a3FirstPhase]);
    const matches = allMatches(container.rounds);

    expect(container.rounds).toHaveLength(6);
    // numberOfGroups × teamsPerGroup × (teamsPerGroup - 1) × legs / 2
    expect(matches).toHaveLength((8 * 4 * 3 * 2) / 2);
    expect(matches).toHaveLength(96);

    for (const round of container.rounds) {
      expect(round.matches).toHaveLength(16);
      expect(new Set(round.matches.map((match) => match.group)).size).toBe(8);
    }
  });

  it('puts every group’s round n into the same round n', () => {
    const container = createMatches(buildTeams(32), [a3FirstPhase]);

    for (const round of container.rounds) {
      const byGroup = new Map<number, number>();
      for (const match of round.matches) {
        byGroup.set(match.group!, (byGroup.get(match.group!) ?? 0) + 1);
      }
      expect([...byGroup.keys()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect([...byGroup.values()]).toEqual([2, 2, 2, 2, 2, 2, 2, 2]);
    }
  });

  it('keeps every group self-contained — no club meets a club from another group', () => {
    const container = createMatches(buildTeams(32), [a3FirstPhase]);
    const groups = splitIntoGroups(buildTeams(32), 8, 4);

    for (const match of allMatches(container.rounds)) {
      const groupIds = groups[match.group!].map((team) => team.id);
      expect(groupIds).toContain(match.homeTeam.id);
      expect(groupIds).toContain(match.awayTeam.id);
    }
  });

  it('tags rounds and matches with their phase', () => {
    const container = createMatches(buildTeams(32), [a3FirstPhase]);

    for (const round of container.rounds) {
      expect(round.phaseIndex).toBe(0);
      expect(round.phaseName).toBe('1ª Fase');
      for (const match of round.matches) {
        expect(match.phaseIndex).toBe(0);
      }
    }
  });

  it('generates the first phase only — later phases depend on results', () => {
    const container = createMatches(buildTeams(18), [
      a1FirstPhase,
      {
        kind: 'knockout',
        name: 'Quartas de Final',
        numberOfTies: 4,
        legs: 2,
        secondLegHost: 'higher-seed',
        tiebreakers: ['goal-difference', 'penalties'],
      },
    ]);

    expect(container.rounds).toHaveLength(17);
    expect(container.rounds.every((round) => round.phaseIndex === 0)).toBe(true);
  });
});

/**
 * Série A3's field shrinks 2 clubs a season, so from its second season it is played in the reduced
 * shape: 4 groups over a single leg, feeding a Quartas instead of an Oitavas. These pin the group
 * split, the group-stage length and the qualifier count at every size the shape is actually played
 * with.
 */
describe('FixtureGenerator — Série A3’s reduced 4-group shape', () => {
  const a3RegulationFirstPhase: RoundRobinPhase = {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 8,
    teamsPerGroup: 4,
    legs: 2,
    advancingPerGroup: 2,
  };

  const a3ReducedFirstPhase: RoundRobinPhase = {
    kind: 'round-robin',
    name: '1ª Fase',
    numberOfGroups: 4,
    teamsPerGroup: 8,
    legs: 1,
    advancingPerGroup: 2,
  };

  const a3Quartas: KnockoutPhase = {
    kind: 'knockout',
    name: 'Quartas de Final',
    numberOfTies: 4,
    legs: 2,
    secondLegHost: 'group-winner',
    tiebreakers: ['goal-difference', 'penalties'],
  };

  it.each([
    [30, [8, 8, 7, 7]],
    [28, [7, 7, 7, 7]],
    [26, [7, 7, 6, 6]],
  ])('splits %i clubs into groups of %j', (fieldSize, expectedSizes) => {
    const groups = splitIntoGroups(buildTeams(fieldSize), 4, 8);

    expect(groups.map((group) => group.length)).toEqual(expectedSizes);
  });

  it.each([30, 28, 26])('plays %i clubs over 7 group-stage rounds', (fieldSize) => {
    const container = createMatches(buildTeams(fieldSize), [a3ReducedFirstPhase]);

    // The longest group sets the round count; a group of 7 takes a bye and still needs 7 rounds.
    expect(container.rounds).toHaveLength(7);
    expect(container.totalRounds).toBe(7);
  });

  it('keeps the group stage comparable in length across the switch', () => {
    // 8 groups of 4 over 2 legs is 6 rounds; 4 groups of 6–8 over 1 leg is 7. Two legs of the
    // reduced shape would have been 12–14, roughly doubling the season.
    const regulation = createMatches(buildTeams(32), [a3RegulationFirstPhase]);
    const reduced = createMatches(buildTeams(26), [a3ReducedFirstPhase]);

    expect(regulation.rounds).toHaveLength(6);
    expect(reduced.rounds).toHaveLength(7);
  });

  it('still plays 32 clubs in 8 groups of 4 over 2 legs', () => {
    const groups = splitIntoGroups(buildTeams(32), 8, 4);

    expect(groups.map((group) => group.length)).toEqual([4, 4, 4, 4, 4, 4, 4, 4]);
    expect(createMatches(buildTeams(32), [a3RegulationFirstPhase]).rounds).toHaveLength(6);
  });

  it.each([30, 28, 26])(
    'sends exactly 8 clubs of a %i-club field into the Quartas',
    (fieldSize) => {
      const groups = splitIntoGroups(buildTeams(fieldSize), 4, 8);
      const qualifiers = groups.flatMap((group, groupIndex) =>
        group.slice(0, a3ReducedFirstPhase.advancingPerGroup).map((team, position) => ({
          team,
          seed: groupIndex * a3ReducedFirstPhase.advancingPerGroup + position + 1,
          group: groupIndex,
          groupPosition: position + 1,
        }))
      );

      expect(qualifiers).toHaveLength(8);
      expect(qualifiers).toHaveLength(a3Quartas.numberOfTies * 2);

      const { ties } = buildKnockoutPhaseRounds(qualifiers, a3Quartas, 'table', 1, 8);

      expect(ties).toHaveLength(4);
      // Every qualifier is used exactly once — the bracket has no byes and no club left over.
      const bracketed = ties.flatMap((tie) => [
        tie.firstLegHost.team.id,
        tie.secondLegHost.team.id,
      ]);
      expect(new Set(bracketed).size).toBe(8);
    }
  );
});
