import { BaseTeam, ChampionshipConfig } from '../../types';
import { ChampionshipUpdate } from '../../reducers/types';

export interface PromotionRelegationContext {
  setTeamsControlledAutomatically: (teams: BaseTeam[]) => void;
  setSeasonMatchCalendar: (calendar: any) => void;
  setChampionship: (championship: string) => void;
  addOrUpdateOtherChampionship: (championship: ChampionshipConfig) => void;
  updateChampionshipState: (championshipUpdateObject: ChampionshipUpdate) => void;
}

export interface PromotionResult {
  promotionChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}

export interface RelegationResult {
  relegationChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}
