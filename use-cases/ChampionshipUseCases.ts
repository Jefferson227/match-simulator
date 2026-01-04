import OperationResult from '../core/results/OperationResult';
import { Championship } from '../core/models/Championship';

function initChampionships(internalName: string): OperationResult<Championship> {
  // TODO: Create ChampionshipDTO

  const operationResult = new OperationResult({} as Championship).getError({} as Championship, {
    errorCode: 'implementation-missing',
    message: 'Function not implemented yet.',
    details: '',
  });

  return operationResult;
}

export { initChampionships };
