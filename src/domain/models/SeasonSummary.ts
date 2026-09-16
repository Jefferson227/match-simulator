import TeamColors from './TeamColors';

/**
 * What the end-of-season page shows: one entry per division the container held while the season was
 * played, top division first.
 *
 * Built by `ChampionshipService.buildSeasonSummary` *before* the roll-over runs — once
 * `runEndOfChampionshipActions` has reset every championship, the tables the summary reads are gone.
 */

export interface SeasonSummaryTeam {
  id: string;
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
}

export interface SeasonSummaryDivision {
  divisionName: string;
  /** The final classification's top two. Absent for a division that produced no table at all. */
  champion?: SeasonSummaryTeam;
  runnerUp?: SeasonSummaryTeam;
  /** Whether the division has a division above / below it at all, which the empty labels read. */
  isPromotable: boolean;
  isRelegatable: boolean;
  /**
   * The clubs that went up besides the top two, and the clubs that went down.
   *
   * `undefined` means the exchange is not tracked rather than empty: the container only computes
   * the half of a neighbour division's exchange that touches the playable one, so the division
   * above has no promotion of its own and the division below no relegation.
   */
  otherPromotedTeams?: SeasonSummaryTeam[];
  relegatedTeams?: SeasonSummaryTeam[];
}

export interface SeasonSummary {
  season: number;
  divisions: SeasonSummaryDivision[];
}
