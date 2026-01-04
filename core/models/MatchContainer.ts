import Match from './Match';

type MatchContainer = {
  timer: number;
  currentSeason: number;
  currentRound: number;
  totalRounds: number;
  matches: Match[];
};

export default MatchContainer;
