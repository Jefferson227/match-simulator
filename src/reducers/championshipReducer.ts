import { BaseTeam, SeasonRound } from '../types';

// Championship state interface
export interface ChampionshipState {
  selectedChampionship: string | null;
  humanPlayerBaseTeam: BaseTeam | null;
  teamsControlledAutomatically: BaseTeam[];
  seasonMatchCalendar: SeasonRound[];
  currentRound: number;
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: string }
  | { type: 'SET_HUMAN_PLAYER_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY'; payload: BaseTeam[] }
  | { type: 'SET_SEASON_MATCH_CALENDAR'; payload: SeasonRound[] }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'INCREMENT_CURRENT_ROUND' }
  | { type: 'RESET' };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: null,
  teamsControlledAutomatically: [],
  seasonMatchCalendar: [],
  currentRound: 1,
};

// Championship reducer
export const championshipReducer = (
  state: ChampionshipState,
  action: ChampionshipAction
): ChampionshipState => {
  switch (action.type) {
    case 'SET_CHAMPIONSHIP':
      return {
        ...state,
        selectedChampionship: action.payload,
      };
    case 'SET_HUMAN_PLAYER_BASE_TEAM':
      return {
        ...state,
        humanPlayerBaseTeam: action.payload,
      };
    case 'SET_TEAMS_CONTROLLED_AUTOMATICALLY':
      return {
        ...state,
        teamsControlledAutomatically: action.payload,
      };
    case 'SET_SEASON_MATCH_CALENDAR':
      return {
        ...state,
        seasonMatchCalendar: action.payload,
      };
    case 'SET_CURRENT_ROUND':
      return {
        ...state,
        currentRound: action.payload,
      };
    case 'INCREMENT_CURRENT_ROUND':
      return {
        ...state,
        currentRound: state.currentRound + 1,
      };
    case 'RESET':
      return initialChampionshipState;
    default:
      return state;
  }
};
