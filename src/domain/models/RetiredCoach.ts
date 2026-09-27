import Coach from './Coach';
import { Team } from './Team';

/**
 * A coach who retired at a season roll-over, kept for the records feature that will show them.
 * A retired coach never returns to the coach pool.
 */
type RetiredCoach = Coach & {
  isRetired: true;
  /** The season that had just ended when they retired. */
  retiredInSeason: number;
  /** The club they left. Absent for a coach who retired out of the coach pool. */
  lastTeamId?: Team['id'];
  lastTeamShortName?: string;
  /**
   * `internalName` of the division their club played the season in. Absent for a pool coach, and
   * for a club coach retired before it was recorded (early MS-113 saves).
   */
  lastChampionshipInternalName?: string;
};

export default RetiredCoach;
