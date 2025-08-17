import { BaseTeam } from '../../types';
import { ChampionshipConfig } from '../../types';

export interface UpdatedTeams {
  promotionChampionshipTeams: BaseTeam[];
  relegationChampionshipTeams: BaseTeam[];
  currentChampionshipTeams: BaseTeam[];
}

export interface PromotionResult {
  newPromotionChampionshipConfig?: ChampionshipConfig;
  promotionChampionshipTeams: BaseTeam[];
  updatedCurrentChampionshipTeams: BaseTeam[];
}

export interface RelegationResult {
  newRelegationChampionshipConfig?: ChampionshipConfig;
  relegationChampionshipTeams: BaseTeam[];
  updatedCurrentChampionshipTeams: BaseTeam[];
}

export interface TeamSelectorTeam {
  name: string;
  fileName: string;
  colors: {
    bg: string;
    border: string;
    text: string;
  };
}

export interface SeasonMatch {
  id: string;
  round: number;
  homeTeam: BaseTeam;
  awayTeam: BaseTeam;
  isPlayed: boolean;
  homeTeamScore?: number;
  awayTeamScore?: number;
}

export interface SeasonRound {
  roundNumber: number;
  matches: SeasonMatch[];
}
