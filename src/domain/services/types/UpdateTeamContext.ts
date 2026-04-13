import Round from '../../models/Round';

type UpdateTeamContext = {
  latestRound?: Round;
  rounds?: Round[];
  randomProvider?: () => number;
};

export default UpdateTeamContext;
