import { Team } from './Team';
import Scorer from './Scorer';

type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  scorers: Scorer[];
};

export default Match;
