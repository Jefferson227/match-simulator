import { BaseTeam, MatchTeam } from '../types';
import teamService from '../services/teamService';

// Define the state interface
export interface GeneralState {
  currentPage: number;
  baseTeam: BaseTeam;
  matchTeam: MatchTeam | null;
  matchOtherTeams: MatchTeam[];
  screenDisplayed: string;
}

// Define the action types
export type GeneralAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_MATCH_TEAM'; payload: MatchTeam }
  | { type: 'SET_MATCH_OTHER_TEAMS' }
  | { type: 'SET_SCREEN_DISPLAYED'; payload: string };

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
      const matchOtherTeams = teamService.getOtherMatchTeams();

      return {
        ...state,
        matchOtherTeams: state.matchTeam
          ? [state.matchTeam, ...matchOtherTeams]
          : matchOtherTeams,
      };
    case 'SET_SCREEN_DISPLAYED':
      return { ...state, screenDisplayed: action.payload };
    default:
      return state;
  }
};
