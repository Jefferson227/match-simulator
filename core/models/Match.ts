import { Team } from './Team';
import Scorer from './Scorer';
import MatchSimulationState from './MatchSimulationState';

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
};

export default Match;
