import { Championship } from '../core/models/Championship';
import ChampionshipContainer from '../core/models/ChampionshipContainer';
import Match from '../core/models/Match';
import { Team } from '../core/models/Team';
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

export function getTeamControlledByHuman(championship: Championship): OperationResult<Team> {
  return ChampionshipService.getTeamControlledByHuman(championship);
}

export function getMatchesForCurrentRound(championship: Championship): OperationResult<Match[]> {
  return ChampionshipService.getMatchesForCurrentRound(championship);
}
