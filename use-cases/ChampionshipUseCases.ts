import { Championship } from '../core/models/Championship';
import ChampionshipContainer from '../core/models/ChampionshipContainer';
import OperationResult from '../core/results/OperationResult';
import ChampionshipService from '../core/services/ChampionshipService';

export function initChampionships(
  championshipInternalName: string
): OperationResult<ChampionshipContainer> {
  return ChampionshipService.initChampionships(championshipInternalName);
}

export function getChampionships(): OperationResult<Championship[]> {
  return ChampionshipService.getChampionships();
}
