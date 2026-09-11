import Standing from '../../models/Standing';

/**
 * The league table cascade, shared by the table, second-leg hosting and the final classification:
 *
 * ```
 * points → wins → goal difference → goals for → team abbreviation (alphabetical)
 * ```
 *
 * Every REC puts *most wins* immediately after points (A1 Art. 16, A2 Art. 15, A3 Art. 16, Série C
 * Art. 16, Série D Art. 16). Head-to-head and card counts, which some RECs rank further down, are
 * not modelled. See `wiki/concepts/tiebreakers.md`.
 *
 * The final `localeCompare` stands in for the RECs' *sorteio*, which a deterministic game cannot
 * draw.
 */
export function compareStandings(a: Standing, b: Standing): number {
  const pointsDifference = b.points - a.points;
  if (pointsDifference !== 0) return pointsDifference;

  const winsDifference = b.wins - a.wins;
  if (winsDifference !== 0) return winsDifference;

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
