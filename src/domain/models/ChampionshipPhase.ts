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
};

/**
 * How the second leg's host is chosen:
 * - `higher-seed` — the better-placed club of the previous phase's table (A1/A2 quarter-finals).
 * - `group-winner` — the club that won its first-phase group (A3's round of 16).
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
