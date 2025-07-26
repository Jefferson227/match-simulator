import { BaseTeam, SeasonRound, TableStanding, ChampionshipConfig } from '../../types';

export interface ChampionshipState {
  selectedChampionship: string | null;
  promotionChampionship?: string | null;
  relegationChampionship?: string | null;
  promotionTeams?: number | null;
  relegationTeams?: number | null;
  humanPlayerBaseTeam: BaseTeam | null;
  teamsControlledAutomatically: BaseTeam[];
  seasonMatchCalendar: SeasonRound[];
  currentRound: number;
  tableStandings: TableStanding[];
  year: number;
  otherChampionships: ChampionshipConfig[];
}
