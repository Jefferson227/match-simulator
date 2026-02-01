import ChampionshipContainer from '../core/models/ChampionshipContainer';

export type GameState = {
  championshipContainer: ChampionshipContainer;
  hasError: boolean;
  errorMessage: string;
};

export type GameAction =
  | { type: 'INIT_CHAMPIONSHIPS'; championshipInternalName: string }
  | { type: 'PING' };
