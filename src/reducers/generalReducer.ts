// Define the state interface
export interface GeneralState {
  currentPage: number;
  selectedTeam: string | null;
  isMatchStarted: boolean;
}

// Define the action types
export type GeneralAction =
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_SELECTED_TEAM'; payload: string | null }
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
    case 'SET_SELECTED_TEAM':
      return {
        ...state,
        selectedTeam: action.payload,
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
