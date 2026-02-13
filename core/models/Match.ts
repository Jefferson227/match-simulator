import { Team } from './Team';
import Scorer from './Scorer';

type Match = {
  id: string;
  homeTeam: Team;
  homeTeamScore: number;
  awayTeamScore: number;
  awayTeam: Team;
  scorers: Scorer[];
};

export default Match;
