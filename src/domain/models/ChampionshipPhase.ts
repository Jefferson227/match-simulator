/**
 * Declarative description of how a championship is actually played.
 *
 * These phases are *recorded*, not executed: nothing in the match engine reads them yet.
 * `ChampionshipService.createMatches` still generates a flat round-robin from
 * `Championship.type`. Group-stage fixture generation, two-legged knockout brackets and
 * per-phase standings resets are MS-103.
 *
 * See `docs/BrasileiraoFeminino.md` for the CBF regulations these shapes were derived from.
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
 */
export type SecondLegHost = 'higher-seed' | 'group-winner' | 'accumulated-points';

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
};

export type ChampionshipPhase = RoundRobinPhase | KnockoutPhase;

export default ChampionshipPhase;
