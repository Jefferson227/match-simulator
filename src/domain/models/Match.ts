import { Team } from './Team';
import Scorer from './Scorer';
import MatchSimulationState from './MatchSimulationState';
import PenaltyShootout from './PenaltyShootout';

type Match = {
  id: string;
  homeTeam: Team;
  homeTeamScore: number;
  awayTeamScore: number;
  awayTeam: Team;
  scorers: Scorer[];
  simulation?: MatchSimulationState;
  latestGoal?: {
    scorerName: string;
  };
  /** Index into `Championship.phases`. Absent for an unphased championship. */
  phaseIndex?: number;
  /** Group this match belongs to, zero-based. Only set during a group stage. */
  group?: number;
  /** Identifies the knockout tie both legs belong to. Absent for a league match. */
  tieId?: string;
  /** Which leg of the tie this is: 1 or 2. Absent for a league match. */
  leg?: number;
  /** Set only when this match's tie went to penalties. */
  penaltyShootout?: PenaltyShootout;
};

export default Match;
