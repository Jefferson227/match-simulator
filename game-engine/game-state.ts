import ChampionshipContainer from '../core/models/ChampionshipContainer';

export type GameState = {
  championshipContainer: ChampionshipContainer;
  hasError: boolean;
  errorMessage: string;
  currentScreen: string;
};

export type GameAction =
  | { type: 'INIT_CHAMPIONSHIPS'; championshipInternalName: string }
  | { type: 'SET_ERROR_MESSAGE'; errorMessage: string }
  | { type: 'SET_CURRENT_SCREEN'; screenName: string }
  | { type: 'SELECT_TEAM'; teamId: string }
  | { type: 'PING' };
