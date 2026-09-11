/**
 * Bracket construction for the knockout phases: who plays whom, and who hosts which leg.
 *
 * Hosting is deliberately **not** one rule — the divisions seed it three different ways and the
 * cups draw it. See `wiki/concepts/phases-and-knockouts.md`.
 */
import Match from '../../models/Match';
import Round from '../../models/Round';
import Standing from '../../models/Standing';
import { Team } from '../../models/Team';
import { KnockoutCrossings, KnockoutPhase, SecondLegHost } from '../../models/ChampionshipPhase';
import { compareStandings } from '../standings/StandingsComparator';
import { RandomProvider } from '../match-simulation/types';

/** A club arriving at a knockout phase, with everything the hosting rules need to rank it. */
export type BracketEntrant = {
  team: Team;
  /** Seed within the phase, 1-based; lower is better. From the 1ª Fase table for A1/A2. */
  seed: number;
  /** Group the club qualified from, zero-based. Only set after a group stage. */
  group?: number;
  /** Placing within that group, 1-based. `1` marks a group winner. */
  groupPosition?: number;
  /** Points and goals summed across every phase played so far. Drives `accumulated-points`. */
  accumulated?: Standing;
  /**
   * Zero-based index of the previous knockout phase's tie this club won. Only set after a knockout;
   * `previous-ties` crossings resolve entrants by it.
   */
  fromTie?: number;
};

export type Tie = {
  /**
   * Deterministic — `p<phaseIndex>-t<tieIndex>`, e.g. `p1-t0`. Both legs carry it as
   * `Match.tieId`, and tie resolution groups matches by it, so it must be stable across a
   * serialise/restore cycle and unique within a competition. A random UUID would satisfy neither:
   * `crypto.randomUUID` is stubbed to a constant under Jest (`src/setupTests.ts`).
   */
  id: string;
  /** Hosts the first leg. */
  firstLegHost: BracketEntrant;
  /** Hosts the second leg, per the phase's `secondLegHost`. */
  secondLegHost: BracketEntrant;
};

/**
 * How the entrants of a knockout phase are paired.
 *
 * - `table` — seeded off a single league table: 1º×8º, 2º×7º, 3º×6º, 4º×5º (A1 Art. 19, A2 Art. 18).
 * - `groups` — the two qualifiers of each group, crossed with the neighbouring group (A3 Art. 14).
 * - `bracket` — the survivors of the previous knockout phase, kept in bracket order, so the winners
 *   of ties *2i* and *2i+1* meet (A1 Art. 20: the semifinal pairings are fixed by bracket).
 * - `draw` — the cups' public draw: the *n*-th club is paired with the *(N+1−n)*-th within the phase
 *   (Copa Anexo B). Any club may face any other; there is no bracket to protect.
 * - `crossings` — the pairings the phase declares in `crossings`, copied from the REC's Anexo B
 *   (Série D's 2ª and 3ª Fases, Série C's final).
 * - `reseed` — the entrants re-ranked on accumulated points, then paired as a `table` (Série D's
 *   quarter-final "Bloco", REC D Art. 18).
 */
export type BracketSeeding = 'table' | 'groups' | 'bracket' | 'draw' | 'crossings' | 'reseed';

/**
 * Standard bracket order for `size` seeds: `[1, 8, 4, 5, 2, 7, 3, 6]` for 8. Reading it in pairs
 * gives the REC's pairings — 1º×8º, 4º×5º, 2º×7º, 3º×6º — in the order that makes the favourites
 * meet as late as possible.
 */
export function bracketSeedOrder(size: number): number[] {
  if (size < 2) return [1];

  let order = [1];
  while (order.length < size) {
    const nextSize = order.length * 2;
    order = order.flatMap((seed) => [seed, nextSize + 1 - seed]);
  }

  return order;
}

function pairsFromTable(entrants: BracketEntrant[]): [BracketEntrant, BracketEntrant][] {
  const bySeed = new Map(entrants.map((entrant) => [entrant.seed, entrant]));
  const order = bracketSeedOrder(entrants.length);
  const pairs: [BracketEntrant, BracketEntrant][] = [];

  for (let i = 0; i < order.length; i += 2) {
    const first = bySeed.get(order[i]);
    const second = bySeed.get(order[i + 1]);
    if (!first || !second) {
      throw new Error(
        `Bracket seeding expects seeds 1..${entrants.length}; seed ${!first ? order[i] : order[i + 1]} is missing.`
      );
    }
    pairs.push([first, second]);
  }

  return pairs;
}

/**
 * Crosses neighbouring groups: the winner of group *g* meets the runner-up of its partner group,
 * and vice versa, so no tie repeats a group-stage fixture and every tie contains exactly one group
 * winner — which is what `group-winner` hosting needs (A3 Art. 18).
 *
 * REC A3 Art. 14 states only that the top two of each group advance. The cross itself is an
 * inference; recorded in `wiki/concepts/invented-data.md`.
 */
function pairsFromGroups(entrants: BracketEntrant[]): [BracketEntrant, BracketEntrant][] {
  const groups = new Map<number, BracketEntrant[]>();

  for (const entrant of entrants) {
    if (entrant.group === undefined) {
      throw new Error('Group-crossed seeding needs every entrant to carry its group.');
    }
    const members = groups.get(entrant.group) ?? [];
    members.push(entrant);
    groups.set(entrant.group, members);
  }

  const groupNumbers = [...groups.keys()].sort((a, b) => a - b);
  if (groupNumbers.length % 2 !== 0) {
    throw new Error(
      `Group-crossed seeding needs an even number of groups; found ${groupNumbers.length}.`
    );
  }

  const winnerFirst: [BracketEntrant, BracketEntrant][] = [];
  const winnerSecond: [BracketEntrant, BracketEntrant][] = [];

  for (let i = 0; i < groupNumbers.length; i += 2) {
    const left = [...(groups.get(groupNumbers[i]) ?? [])].sort(
      (a, b) => (a.groupPosition ?? a.seed) - (b.groupPosition ?? b.seed)
    );
    const right = [...(groups.get(groupNumbers[i + 1]) ?? [])].sort(
      (a, b) => (a.groupPosition ?? a.seed) - (b.groupPosition ?? b.seed)
    );

    if (left.length !== 2 || right.length !== 2) {
      throw new Error('Group-crossed seeding expects exactly two qualifiers per group.');
    }

    winnerFirst.push([left[0], right[1]]);
    winnerSecond.push([right[0], left[1]]);
  }

  // Interleaved so the two ties of a group pair sit apart, and the winners of adjacent ties come
  // from different group pairs.
  return [...winnerFirst, ...winnerSecond];
}

/**
 * Pairs the entrants exactly as the phase's `crossings` declare, in declared order. The repository
 * already rejects a crossing the previous phase cannot produce; this throws too, so a malformed
 * season can never be generated silently.
 */
function pairsFromCrossings(
  entrants: BracketEntrant[],
  crossings: KnockoutCrossings
): [BracketEntrant, BracketEntrant][] {
  const used = new Set<BracketEntrant>();

  const take = (entrant: BracketEntrant | undefined, label: string): BracketEntrant => {
    if (!entrant) throw new Error(`Crossing names ${label}, which no entrant holds.`);
    if (used.has(entrant)) throw new Error(`Crossing names ${label} twice.`);
    used.add(entrant);
    return entrant;
  };

  if (crossings.from === 'group-position') {
    return crossings.pairs.map(
      (pair) =>
        pair.map((slot) =>
          take(
            entrants.find(
              (entrant) => entrant.group === slot.group && entrant.groupPosition === slot.position
            ),
            `group ${slot.group} position ${slot.position}`
          )
        ) as [BracketEntrant, BracketEntrant]
    );
  }

  return crossings.pairs.map(
    (pair) =>
      pair.map((tieIndex) =>
        take(
          entrants.find((entrant) => entrant.fromTie === tieIndex),
          `the winner of tie ${tieIndex}`
        )
      ) as [BracketEntrant, BracketEntrant]
  );
}

/**
 * Re-ranks the entrants on points accumulated across every phase and renumbers their seeds 1..N, so
 * `table` pairing and `higher-seed` hosting both read the new order (REC D Art. 18 §§1–2). An
 * entrant with no accumulated table keeps its place behind those that have one, by seed.
 */
export function reseedOnAccumulatedPoints(entrants: BracketEntrant[]): BracketEntrant[] {
  return [...entrants]
    .sort((a, b) => {
      if (a.accumulated && b.accumulated) {
        const comparison = compareStandings(a.accumulated, b.accumulated);
        if (comparison !== 0) return comparison;
      } else if (a.accumulated || b.accumulated) {
        return a.accumulated ? -1 : 1;
      }
      return a.seed - b.seed;
    })
    .map((entrant, index) => ({ ...entrant, seed: index + 1 }));
}

/** Copa Anexo B: the n-th club meets the (N+1−n)-th. */
function pairsFromDraw(entrants: BracketEntrant[]): [BracketEntrant, BracketEntrant][] {
  const pairs: [BracketEntrant, BracketEntrant][] = [];
  for (let i = 0; i < entrants.length / 2; i++) {
    pairs.push([entrants[i], entrants[entrants.length - 1 - i]]);
  }
  return pairs;
}

function pairsInBracketOrder(entrants: BracketEntrant[]): [BracketEntrant, BracketEntrant][] {
  const pairs: [BracketEntrant, BracketEntrant][] = [];
  for (let i = 0; i < entrants.length; i += 2) {
    pairs.push([entrants[i], entrants[i + 1]]);
  }
  return pairs;
}

/**
 * Picks which of the two clubs hosts the second leg — or, for a single-legged phase, the only leg.
 *
 * `rng` is reached only by the `drawn` mode, which the cups use and the divisions never do.
 */
export function resolveSecondLegHost(
  first: BracketEntrant,
  second: BracketEntrant,
  mode: SecondLegHost,
  rng?: RandomProvider
): BracketEntrant {
  if (mode === 'drawn') {
    // A public draw. Without an rng — a pure call from a screen, say — the seed keeps it stable.
    if (!rng) return first.seed <= second.seed ? first : second;
    return rng.nextInt(0, 1) === 0 ? first : second;
  }

  if (mode === 'group-winner') {
    // The better group placing hosts: the winner against a runner-up (A3 Art. 18), and the 1º/2º
    // club against the 3º/4º one (REC D Art. 21 §1).
    const firstPlace = first.groupPosition;
    const secondPlace = second.groupPosition;
    if (firstPlace !== undefined && secondPlace !== undefined && firstPlace !== secondPlace) {
      return firstPlace < secondPlace ? first : second;
    }
    // Equal or unknown placings — fall back to the seed, which is never ambiguous.
    return first.seed <= second.seed ? first : second;
  }

  if (mode === 'accumulated-points') {
    if (first.accumulated && second.accumulated) {
      const comparison = compareStandings(first.accumulated, second.accumulated);
      if (comparison !== 0) return comparison < 0 ? first : second;
    }
    return first.seed <= second.seed ? first : second;
  }

  // 'higher-seed' — the club placed higher in the previous table hosts.
  return first.seed <= second.seed ? first : second;
}

/** Pairs the entrants and decides both legs' hosts, without generating any fixtures yet. */
export function buildTies(
  entrants: BracketEntrant[],
  phase: KnockoutPhase,
  seeding: BracketSeeding,
  phaseIndex: number,
  rng?: RandomProvider
): Tie[] {
  const expected = phase.numberOfTies * 2;
  if (entrants.length !== expected) {
    throw new Error(
      `Phase '${phase.name}' expects ${expected} clubs for ${phase.numberOfTies} ties; received ${entrants.length}.`
    );
  }

  let pairs: [BracketEntrant, BracketEntrant][];
  if (seeding === 'crossings') {
    if (!phase.crossings) {
      throw new Error(`Phase '${phase.name}' is seeded by crossings but declares none.`);
    }
    pairs = pairsFromCrossings(entrants, phase.crossings);
  } else if (seeding === 'reseed') {
    pairs = pairsFromTable(reseedOnAccumulatedPoints(entrants));
  } else if (seeding === 'table') {
    pairs = pairsFromTable(entrants);
  } else if (seeding === 'groups') {
    pairs = pairsFromGroups(entrants);
  } else if (seeding === 'draw') {
    pairs = pairsFromDraw(entrants);
  } else {
    pairs = pairsInBracketOrder(entrants);
  }

  return pairs.map(([first, second], index) => {
    const secondLegHost = resolveSecondLegHost(first, second, phase.secondLegHost, rng);
    const firstLegHost = secondLegHost === first ? second : first;
    return { id: `p${phaseIndex}-t${index}`, firstLegHost, secondLegHost };
  });
}

function createMatch(home: Team, away: Team, fields: Partial<Match>): Match {
  return {
    id: crypto.randomUUID(),
    homeTeam: home,
    homeTeamScore: 0,
    awayTeamScore: 0,
    awayTeam: away,
    scorers: [],
    ...fields,
  };
}

/**
 * Turns ties into rounds: one round per leg, the second reversing home and away. A `legs: 1` phase
 * produces a single round hosted by whoever the phase's hosting rule picked.
 */
export function buildKnockoutRounds(
  ties: Tie[],
  phase: KnockoutPhase,
  phaseIndex: number,
  firstRoundNumber: number
): Round[] {
  const rounds: Round[] = [];

  for (let leg = 1; leg <= phase.legs; leg++) {
    const matches = ties.map((tie) => {
      const host = leg === phase.legs ? tie.secondLegHost : tie.firstLegHost;
      const visitor = host === tie.secondLegHost ? tie.firstLegHost : tie.secondLegHost;
      return createMatch(host.team, visitor.team, {
        phaseIndex,
        tieId: tie.id,
        leg,
      });
    });

    rounds.push({
      id: crypto.randomUUID(),
      number: firstRoundNumber + leg - 1,
      matches,
      status: 'not-started',
      phaseIndex,
      phaseName: phase.name,
    });
  }

  return rounds;
}

/** Convenience: seed the bracket and generate its rounds in one call. */
export function buildKnockoutPhaseRounds(
  entrants: BracketEntrant[],
  phase: KnockoutPhase,
  seeding: BracketSeeding,
  phaseIndex: number,
  firstRoundNumber: number,
  rng?: RandomProvider
): { rounds: Round[]; ties: Tie[] } {
  const ties = buildTies(entrants, phase, seeding, phaseIndex, rng);
  return { rounds: buildKnockoutRounds(ties, phase, phaseIndex, firstRoundNumber), ties };
}
