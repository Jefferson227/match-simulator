/**
 * Declarative description of how a championship is actually played.
 *
 * See `wiki/concepts/phases-and-knockouts.md` for the CBF regulations these shapes were derived
 * from, and the per-competition table of which phase uses which `secondLegHost`.
 */

/** A phase where every club in a group plays every other club, once (`legs: 1`) or twice (`legs: 2`). */
export type RoundRobinPhase = {
  kind: 'round-robin';
  /** Display name as the regulation spells it, e.g. '1ª Fase'. */
  name: string;
  /** 1 for a single league table, 8 for Série A3's eight groups. */
  numberOfGroups: number;
  teamsPerGroup: number;
  legs: 1 | 2;
  /** How many clubs of each group go through to the next phase. */
  advancingPerGroup: number;
  /**
   * How the field is dealt into groups. Absent means `declared-order`.
   * - `declared-order` — consecutive slices of the field as given (A3's regional groups, Série D's
   *   Anexo B groups).
   * - `serpentine` — a ranked field dealt snaking across the groups: 1→A, 2→B, 3→B, 4→A, 5→A…
   *   Série C's 2ª Fase is built this way from the 1ª Fase table, 1-4-5-8 / 2-3-6-7 (REC C Art. 13,
   *   Anexo B).
   */
  groupAllocation?: 'declared-order' | 'serpentine';
};

/** A placing in a group of the previous round-robin phase: zero-based group, 1-based position. */
export type GroupSlot = { group: number; position: number };

/**
 * Fixed pairings a regulation prints in its Anexo B, rather than a seeding rule.
 *
 * - `group-position` — each pair names two group placings of the previous round-robin phase
 *   (Série D's 2ª Fase: 1º A-1 × 4º A-2…; Série C's final: the two group winners).
 * - `previous-ties` — each pair names two ties of the previous knockout phase, by zero-based index
 *   in the order they were emitted; their winners meet (Série D's 3ª Fase: W(B-1) × W(B-6)…).
 *
 * Pair order is emission order: the ties are generated in the order declared, so a later phase
 * seeded by `bracket` pairs the winners of pairs *2i* and *2i+1*.
 */
export type KnockoutCrossings =
  | { from: 'group-position'; pairs: [GroupSlot, GroupSlot][] }
  | { from: 'previous-ties'; pairs: [number, number][] };

/**
 * How the second leg's host is chosen:
 * - `higher-seed` — the better-placed club of the previous phase's table (A1/A2 quarter-finals).
 * - `group-winner` — the club with the better placing in its first-phase group hosts; the seed
 *   decides when both placings are equal or absent. A3's round of 16 (1º × 2º, A3 Art. 18) and Série
 *   D's 2ª Fase, where the 1º/2º club hosts the 3º/4º one (REC D Art. 21 §1).
 * - `accumulated-points` — most points across every phase played so far (all semifinals and finals).
 * - `drawn` — a public DCO draw, redone at every phase. The cups use this and only this; the
 *   divisions' seeded hosting right does not apply to them (Copa Arts. 14–21, Supercopa Art. 12 §1).
 */
export type SecondLegHost = 'higher-seed' | 'group-winner' | 'accumulated-points' | 'drawn';

/** A knockout tie. Ties are level on points, so these decide them, in order. */
export type KnockoutTiebreaker = 'goal-difference' | 'penalties';

export type KnockoutPhase = {
  kind: 'knockout';
  /** Display name as the regulation spells it, e.g. 'Quartas de Final'. */
  name: string;
  numberOfTies: number;
  legs: 1 | 2;
  secondLegHost: SecondLegHost;
  tiebreakers: KnockoutTiebreaker[];
  /**
   * Clubs joining the competition at this phase, named as they are in the seed data.
   *
   * A cup has **staggered entry** and no byes: the Copa's 66 clubs enter at the Preliminar, 1ª, 2ª
   * or 3ª Fase by Ranking Adaptado (Copa Arts. 14–17). The repository resolves these names into
   * `Championship.phaseEntrants`.
   */
  entrants?: string[];
  /** Pairings fixed by the regulation. Absent means the phase is seeded by the default rules. */
  crossings?: KnockoutCrossings;
  /**
   * Re-rank the entrants before pairing them. `accumulated-points` orders them on points summed
   * across every phase, then pairs them 1×8, 4×5, 2×7, 3×6 as a single table would — Série D's
   * "Bloco" (REC D Art. 18).
   */
  reseed?: 'accumulated-points';
};

export type ChampionshipPhase = RoundRobinPhase | KnockoutPhase;

/**
 * One shape a competition can be played in, guarded by the smallest field it needs.
 *
 * A division whose club count moves across season roll-overs cannot keep a single frozen shape:
 * Série A3 loses clubs every season, and eight groups of four becomes eight lopsided groups. A
 * competition therefore declares its shapes most demanding first, and the roll-over picks the first
 * one the actual field satisfies.
 */
export type PhaseVariant = {
  /** Smallest field this shape can be played with. Variants are matched in declared order. */
  minNumberOfTeams: number;
  phases: ChampionshipPhase[];
};

export default ChampionshipPhase;
