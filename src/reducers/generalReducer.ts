import { BaseTeam, MatchTeam } from '../types';
import teamService from '../services/teamService';

// Define the state interface
export interface GeneralState {
  currentPage: number;
  baseTeam: BaseTeam;
  matchTeam: MatchTeam | null;
  matchOtherTeams: MatchTeam[];
  screenDisplayed: string;
  clockSpeed: number;
}

// Define the action types
export type GeneralAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_MATCH_TEAM'; payload: MatchTeam }
  | { type: 'SET_MATCH_OTHER_TEAMS' }
  | { type: 'SET_SCREEN_DISPLAYED'; payload: string }
  | { type: 'SET_CLOCK_SPEED'; payload: number }
  | { type: 'LOAD_STATE'; payload: GeneralState };

// Create the reducer
export const generalReducer = (
  state: GeneralState,
  action: GeneralAction
): GeneralState => {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    case 'SET_BASE_TEAM':
      return {
        ...state,
        baseTeam: action.payload,
      };
    case 'SET_MATCH_TEAM':
      return {
        ...state,
        matchTeam: action.payload,
      };
    case 'SET_MATCH_OTHER_TEAMS':
      // TODO: Since it's returning an array of the player's team plus the other teams, this needs to be renamed
      // For now, just return the current state since getOtherMatchTeams doesn't exist
      return {
        ...state,
        matchOtherTeams: state.matchOtherTeams,
      };
    case 'SET_SCREEN_DISPLAYED':
      return { ...state, screenDisplayed: action.payload };
    case 'SET_CLOCK_SPEED':
      return { ...state, clockSpeed: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};
