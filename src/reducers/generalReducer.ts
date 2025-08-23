import { GeneralState, GeneralAction } from './types';

export const generalReducer = (state: GeneralState, action: GeneralAction): GeneralState => {
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
    case 'SET_VIEWING_TEAM':
      return { ...state, viewingTeam: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};
