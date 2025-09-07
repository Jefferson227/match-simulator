import {
  BaseTeam,
  ChampionshipConfig,
  Match,
  SeasonRound,
  TableStanding,
  MatchTeam,
  GroupTableStandings,
} from '../../types';

export type ChampionshipFormat = 'double-round-robin' | 'single-round-robin;quadrangular';
export type ChampionshipPhase = 'double-round-robin' | 'single-round-robin' | 'quadrangular';

export interface ChampionshipState {
  championshipConfigId: string | null;
  name: string | null;
  selectedChampionship: string | null;
  promotionChampionship?: string | null;
  relegationChampionship?: string | null;
  promotionTeams?: number | null;
  relegationTeams?: number | null;
  humanPlayerBaseTeam: BaseTeam;
  teamsControlledAutomatically: BaseTeam[];
  seasonMatchCalendar: SeasonRound[];
  currentRound: number;
  tableStandings: TableStanding[];
  groupStandings: GroupTableStandings[];
  phase: ChampionshipPhase;
  year: number;
  otherChampionships: ChampionshipConfig[];
  topScorers: TopScorer[];
  format: ChampionshipFormat;
}

export interface ChampionshipUpdate {
  newSelectedChampionship: string;
  newChampionshipFullName: string;
  newPromotionChampionshipName: string | null;
  newRelegationChampionshipName: string | null;
  newPromotionTeams: number | undefined;
  newRelegationTeams: number | undefined;
  newPromotionChampionshipConfig: ChampionshipConfig | undefined;
  newRelegationChampionshipConfig: ChampionshipConfig | undefined;
  previousChampionship: ChampionshipConfig | undefined;
  updatedTeamsControlledAutomatically: BaseTeam[];
  seasonCalendar: SeasonRound[];
}

export interface TopScorer {
  teamId: string;
  playerId: string;
  goals: number;
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: ChampionshipConfig }
  | { type: 'SET_HUMAN_PLAYER_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY'; payload: BaseTeam[] }
  | { type: 'SET_SEASON_MATCH_CALENDAR'; payload: SeasonRound[] }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'INCREMENT_CURRENT_ROUND' }
  | { type: 'UPDATE_TABLE_STANDINGS'; payload: Match[] }
  | { type: 'RESET_TABLE_STANDINGS' }
  | { type: 'GET_TABLE_STANDINGS' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; payload: ChampionshipState }
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'INCREMENT_YEAR' }
  | { type: 'SET_OTHER_CHAMPIONSHIPS'; payload: ChampionshipConfig[] }
  | { type: 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP'; payload: ChampionshipConfig }
  | {
      type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY_FOR_OTHER_CHAMPIONSHIPS';
      payload: ChampionshipConfig[];
    }
  | { type: 'UPDATE_TEAM_MORALE'; payload: Match[] }
  | { type: 'UPDATE_TOP_SCORERS'; payload: Match[] }
  | { type: 'RESET_TOP_SCORERS' }
  | { type: 'UPDATE_CHAMPIONSHIP_STATE'; payload: ChampionshipUpdate };

export interface GeneralState {
  currentPage: number;
  baseTeam: BaseTeam;
  matchTeam: MatchTeam | null;
  matchOtherTeams: MatchTeam[];
  screenDisplayed: string;
  previousScreenDisplayed: string;
  clockSpeed: number;
  viewingTeam: BaseTeam | null;
  isRoundOver: boolean;
}

export interface PlayerStrengthUpdate {
  numberOfPlayers: number;
  strengthChange: number;
}

export type MoraleType = 'bad' | 'neutral' | 'good';

export type TeamMatchResult = 'win' | 'loss' | 'draw';

export type GeneralAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_MATCH_TEAM'; payload: MatchTeam }
  | { type: 'SET_MATCH_OTHER_TEAMS' }
  | { type: 'SET_SCREEN_DISPLAYED'; payload: string }
  | { type: 'SET_CLOCK_SPEED'; payload: number }
  | { type: 'SET_VIEWING_TEAM'; payload: BaseTeam | null }
  | { type: 'SET_IS_ROUND_OVER'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: GeneralState };
