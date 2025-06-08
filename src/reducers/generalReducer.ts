import { Team } from '../types';
import teamService from '../services/teamService';

// Define the state interface
export interface GeneralState {
  currentPage: number;
  selectedTeam: Team;
  isMatchStarted: boolean;
}

// Define the action types
export type GeneralAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'GET_SELECTED_TEAM' }
  | { type: 'SET_MATCH_STARTED'; payload: boolean };

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
    case 'GET_SELECTED_TEAM':
      return {
        ...state,
        selectedTeam: teamService.getSelectedTeam(),
      };
    case 'SET_MATCH_STARTED':
      return {
        ...state,
        isMatchStarted: action.payload,
      };
    default:
      return state;
  }
};
