import { BaseTeam, ChampionshipConfig, Match, SeasonRound } from '../../types';
import { ChampionshipState } from './ChampionshipState';

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
  | { type: 'UPDATE_TEAM_MORALE'; payload: Match[] };
