// Championship state interface
export interface ChampionshipState {
  selectedChampionship: string | null;
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: string }
  | { type: 'RESET' };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
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
    case 'RESET':
      return initialChampionshipState;
    default:
      return state;
  }
};
