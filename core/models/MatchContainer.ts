import Round from './Round';

type MatchContainer = {
  timer: number;
  currentSeason: number;
  currentRound: number;
  totalRounds: number;
  rounds: Round[];
};

export default MatchContainer;
