import { Team } from './Team';

type Standing = {
  team: Team;
  position: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

export default Standing;
