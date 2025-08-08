import { BaseTeam } from '../../types';
import { ChampionshipConfig } from '../../types';

export interface UpdatedTeams {
  promotionChampionshipTeams: BaseTeam[];
  relegationChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}

export interface PromotionResult {
  newPromotionChampionshipConfig?: ChampionshipConfig;
  promotionUpdatedTeams?: UpdatedTeams;
  updatedCurrentChampionshipTeams: BaseTeam[];
}

export interface RelegationResult {
  relegationChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}
