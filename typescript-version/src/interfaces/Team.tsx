import Player from './Player';

interface TeamColor {
  outline: string;
  background: string;
  name: string;
}

interface Team {
  name: string;
  abbreviation: string;
  colors: TeamColor;
  players: Array<Player>;
}

export default Team;
