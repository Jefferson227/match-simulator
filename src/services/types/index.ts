import { BaseTeam } from '../../types';

export interface PromotionResult {
  promotionChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}

export interface RelegationResult {
  relegationChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}
