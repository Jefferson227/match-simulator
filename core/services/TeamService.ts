import { Championship } from '../models/Championship';
import { Team } from '../models/Team';
import OperationResult from '../results/OperationResult';

function getTeamsToSelect(championship: Championship): OperationResult<Team[]> {
  try {
    const result = new OperationResult(championship.startingTeams);
    result.setSuccess();

    return result;
  } catch (error) {
    const result = new OperationResult([] as Team[]);
    const message = error instanceof Error ? error.message : String(error);
    result.setError({ errorCode: 'exception', message });
    return result;
  }
}

export default {
  getTeamsToSelect,
};
