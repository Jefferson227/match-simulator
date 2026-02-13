import { Team } from './Team';
import Scorer from './Scorer';

type Match = {
  id: string;
  homeTeam: Team;
  // homeTeamScore: number; // To be added later, when the logic on MatchSimulator screen takes place
  // awayTeamScore: number; // To be added later, when the logic on MatchSimulator screen takes place
  awayTeam: Team;
  scorers: Scorer[];
};

export default Match;
