import Round from '../models/Round';

export type UpdateTeamContext = {
  latestRound?: Round;
  rounds?: Round[];
  randomProvider?: () => number;
};
