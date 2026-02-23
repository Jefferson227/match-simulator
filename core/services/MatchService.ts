import ChampionshipContainer from '../models/ChampionshipContainer';
import OperationResult from '../results/OperationResult';

const runMatchActions = (
  championshipContainer: ChampionshipContainer
): OperationResult<ChampionshipContainer> => {
  const result = new OperationResult({} as ChampionshipContainer);
  result.setError({ errorCode: 'implementation-missing', message: 'Implementation is missing.' });
  return result;
};

export default {
  runMatchActions,
};
