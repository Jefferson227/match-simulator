import { Championship } from '../../models/Championship';
import ChampionshipPhase from '../../models/ChampionshipPhase';

/**
 * Rounds a single-rotation round-robin of `groupSize` clubs takes: an even group plays `n - 1`, an
 * odd one gets a bye and plays `n` (`FixtureGenerator.buildRoundRobinRounds`).
 */
function roundsPerLeg(groupSize: number): number {
  if (groupSize < 2) return 0;
  return groupSize % 2 === 0 ? groupSize - 1 : groupSize;
}

/**
 * Rounds a phase generates for a field of `fieldSize` clubs.
 *
 * Groups are played in merged rounds, so a round-robin phase lasts as long as its largest group.
 * `splitIntoGroups` and the serpentine deal both spread an uneven field so group sizes differ by at
 * most one, and the ceiling group never plays fewer rounds than the floor one — an odd ceiling plays
 * `n`, an even ceiling `n - 1`, which is the floor group's `n`.
 */
function roundsOfPhase(phase: ChampionshipPhase, fieldSize: number): number {
  if (phase.kind === 'knockout') return phase.numberOfTies > 0 ? phase.legs : 0;

  const largestGroup =
    phase.numberOfGroups > 1 ? Math.ceil(fieldSize / phase.numberOfGroups) : fieldSize;
  return roundsPerLeg(largestGroup) * phase.legs;
}

/** How many clubs come out of a phase into the next one. */
function qualifiersOf(phase: ChampionshipPhase): number {
  return phase.kind === 'knockout'
    ? phase.numberOfTies
    : phase.numberOfGroups * phase.advancingPerGroup;
}

/**
 * How many rounds a division plays in its current season, known before the season is played.
 *
 * An unphased division generates every round up front, so its `totalRounds` is the answer. A phased
 * one generates each phase only once the previous one is resolved, so its `totalRounds` grows as the
 * season goes; the count is derived from `phases` instead, walking the field from phase to phase —
 * each phase's qualifiers plus any staggered entrants (`phaseEntrants`) make the next one's field.
 *
 * Pure. Used to pace the AI divisions against the playable one (MS-109).
 */
export function getSeasonRoundCount(championship: Championship): number {
  const { phases } = championship;
  if (!phases?.length) return championship.matchContainer.totalRounds;

  const entrants = championship.phaseEntrants;
  let fieldSize = entrants?.[0]?.length ? entrants[0].length : championship.teams.length;
  let total = 0;

  phases.forEach((phase, index) => {
    if (index > 0) fieldSize = qualifiersOf(phases[index - 1]) + (entrants?.[index]?.length ?? 0);
    total += roundsOfPhase(phase, fieldSize);
  });

  return total;
}
