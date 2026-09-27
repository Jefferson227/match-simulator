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
};

export default RetiredCoach;
