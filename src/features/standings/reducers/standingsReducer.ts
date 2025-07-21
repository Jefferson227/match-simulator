import { TeamStanding } from '../types';

export type StandingsAction =
  | { type: 'SET_STANDINGS'; payload: TeamStanding[] }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STANDINGS' };

export const initialState = {
  standings: [],
  currentPage: 0,
  isLoading: false,
  error: null,
} as const;

export type StandingsState = typeof initialState;

export function standingsReducer(
  state: StandingsState,
  action: StandingsAction
): StandingsState {
  switch (action.type) {
    case 'SET_STANDINGS':
      return {
        ...state,
        standings: action.payload,
        isLoading: false,
        error: null,
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'RESET_STANDINGS':
      return initialState;

    default:
      return state;
  }
}
