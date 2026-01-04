import { Team } from './Team';
import Scorer from './Scorer';

type Match = {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  scorers: Scorer[];
};

export default Match;
