import { BaseTeam, SeasonRound, TableStanding, Match, ChampionshipConfig } from '@types';
import { ChampionshipService } from '../services';

// Championship state interface
export interface ChampionshipState {
  selectedChampionship: string | null;
  humanPlayerBaseTeam: BaseTeam | null;
  teamsControlledAutomatically: BaseTeam[];
  seasonMatchCalendar: SeasonRound[];
  currentRound: number;
  tableStandings: TableStanding[];
  year: number;
  otherChampionships: ChampionshipConfig[];
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: string }
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
    };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: null,
  teamsControlledAutomatically: [],
  seasonMatchCalendar: [],
  currentRound: 1,
  tableStandings: [],
  year: 0,
  otherChampionships: [],
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
    case 'UPDATE_TABLE_STANDINGS': {
      const updatedStandings = ChampionshipService.calculateUpdatedStandings(
        state.tableStandings,
        action.payload
      );
      return {
        ...state,
        tableStandings: updatedStandings,
      };
    }
    case 'RESET_TABLE_STANDINGS':
      return {
        ...state,
        tableStandings: [],
      };
    case 'GET_TABLE_STANDINGS':
      return state;
    case 'RESET':
      return initialChampionshipState;
    case 'LOAD_STATE':
      return action.payload;
    case 'SET_YEAR':
      return {
        ...state,
        year: action.payload,
      };
    case 'INCREMENT_YEAR':
      return {
        ...state,
        year: state.year + 1,
      };
    case 'SET_OTHER_CHAMPIONSHIPS':
      return {
        ...state,
        otherChampionships: action.payload,
      };
    case 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP':
      return {
        ...state,
        otherChampionships: (() => {
          const existingIndex = state.otherChampionships.findIndex(
            (champ) => champ.internalName === action.payload.internalName
          );

          if (existingIndex >= 0) {
            // Update existing championship
            return state.otherChampionships.map((champ, index) =>
              index === existingIndex ? action.payload : champ
            );
          } else {
            // Add new championship
            return [...state.otherChampionships, action.payload];
          }
        })(),
      };
    case 'SET_TEAMS_CONTROLLED_AUTOMATICALLY_FOR_OTHER_CHAMPIONSHIPS':
      return {
        ...state,
        otherChampionships: action.payload,
      };
    default:
      return state;
  }
};
