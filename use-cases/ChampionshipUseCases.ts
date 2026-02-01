import ChampionshipContainer from '../core/models/ChampionshipContainer';
import OperationResult from '../core/results/OperationResult';
import ChampionshipService from '../core/services/ChampionshipService';

export function initChampionships(
  championshipInternalName: string
): OperationResult<ChampionshipContainer> {
  return ChampionshipService.initChampionships(championshipInternalName);
}

export function getChampionshipInternalNames(): OperationResult<string> {
  // TODO: Implement this function
  const result = new OperationResult('');
  result.setError({ errorCode: 'implementation-missing', message: 'Implementation missing.' });
  return result;
}
