import TeamColors from './TeamColors';

/**
 * What the end-of-season page shows: one entry per division of the pyramid, top tier first.
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
  /** Whether this is the division the human's club played the season in. The page opens on it. */
  isHumanDivision: boolean;
  /**
   * The clubs that went up besides the top two, and the clubs that went down.
   *
   * Every boundary of the pyramid is exchanged at roll-over (MS-109), so both lists are always
   * known. Empty means nobody moved that way — at the top or bottom of the pyramid, or when the
   * top two were the whole promotion.
   */
  otherPromotedTeams: SeasonSummaryTeam[];
  relegatedTeams: SeasonSummaryTeam[];
}

export interface SeasonSummary {
  season: number;
  divisions: SeasonSummaryDivision[];
}
