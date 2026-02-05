import ChampionshipContainer from '../core/models/ChampionshipContainer';
import { Team } from '../core/models/Team';
import OperationResult from '../core/results/OperationResult';

export function getTeamsToSelect(
  championshipContainer: ChampionshipContainer
): OperationResult<Team[]> {
  const result = new OperationResult([] as Team[]);
  result.setError({ errorCode: 'implementation-missing', message: 'Implementation is missing.' });
  return result;
}
