import Player from './Player';
import { Team } from './Team';

/**
 * A player who retired at a season roll-over, kept for the records feature that will show them.
 *
 * A snapshot of the player on the day they retired, without the match-scoped fields a player off
 * the pitch never carries.
 */
type RetiredPlayer = Omit<Player, 'stamina' | 'enteredAtMinute' | 'isStarter' | 'isSub'> & {
  isRetired: true;
  /** The season that had just ended when they retired. */
  retiredInSeason: number;
  lastTeamId: Team['id'];
  lastTeamShortName: string;
};

export default RetiredPlayer;
