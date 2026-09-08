import Standing from '../../models/Standing';

/**
 * The league table cascade the engine has always used:
 *
 * ```
 * points → goal difference → goals for → team abbreviation (alphabetical)
 * ```
 *
 * Moved here verbatim from `ChampionshipService.updateStandings` so the table, second-leg hosting
 * and the final classification all order clubs the same way.
 *
 * > **Known defect, deliberately preserved.** Every REC puts *most wins* immediately after points,
 * > ahead of goal difference (A1 Art. 16, A2 Art. 15, A3 Art. 16). This cascade skips it, even
 * > though `Standing.wins` is tracked. Fixing it is out of MS-103's scope — it changes the men's
 * > tables too. See `wiki/concepts/tiebreakers.md`. It now has one place to be fixed rather than
 * > three.
 *
 * The final `localeCompare` stands in for the RECs' *sorteio*, which a deterministic game cannot
 * draw.
 */
export function compareStandings(a: Standing, b: Standing): number {
  const pointsDifference = b.points - a.points;
  if (pointsDifference !== 0) return pointsDifference;

  const goalDifferenceA = a.goalsFor - a.goalsAgainst;
  const goalDifferenceB = b.goalsFor - b.goalsAgainst;
  const goalDifference = goalDifferenceB - goalDifferenceA;
  if (goalDifference !== 0) return goalDifference;

  const goalsForDifference = b.goalsFor - a.goalsFor;
  if (goalsForDifference !== 0) return goalsForDifference;

  return a.team.abbreviation.localeCompare(b.team.abbreviation);
}

/** Sorts a copy of `standings` by the cascade and renumbers `position` from 1. */
export function rankStandings(standings: Standing[]): Standing[] {
  return [...standings].sort(compareStandings).map((standing, index) => ({
    ...standing,
    position: index + 1,
  }));
}

export default compareStandings;
