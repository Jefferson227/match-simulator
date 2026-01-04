import Player from './Player';
import ScorerTeam from '../enums/ScorerTeam';

type Scorer = {
  player: Player;
  scorerTeam: ScorerTeam;
  time: number;
};

export default Scorer;
