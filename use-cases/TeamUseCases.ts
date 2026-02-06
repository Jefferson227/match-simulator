import { Championship } from '../core/models/Championship';
import { Team } from '../core/models/Team';
import OperationResult from '../core/results/OperationResult';
import TeamService from '../core/services/TeamService';

export function getTeamsToSelect(championship: Championship): OperationResult<Team[]> {
  return TeamService.getTeamsToSelect(championship);
}
