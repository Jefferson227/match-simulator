import { BaseTeam } from '../types';

// Championship state interface
export interface ChampionshipState {
  selectedChampionship: string | null;
  humanPlayerBaseTeam: BaseTeam | null;
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: string }
  | { type: 'SET_HUMAN_PLAYER_BASE_TEAM'; payload: BaseTeam }
  | { type: 'RESET' };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: null,
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
    case 'RESET':
      return initialChampionshipState;
    default:
      return state;
  }
};
