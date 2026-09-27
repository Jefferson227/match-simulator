import Player from './Player';
import RetiredPlayer from './RetiredPlayer';
import { Team } from './Team';

export type RetirementReportEntry = {
  retired: RetiredPlayer;
  /** The generated player who took the retiree's place in the squad. */
  replacement: Player;
  /** Whether the retiree went into the coach pool. */
  becameCoach: boolean;
};

/**
 * The retirements of the human's club at one season roll-over — what the Retirements page shows.
 * Other clubs' retirements are only recorded in the retired lists.
 */
type RetirementReport = {
  /** The season that had just ended. */
  season: number;
  teamId: Team['id'];
  entries: RetirementReportEntry[];
};

export default RetirementReport;
