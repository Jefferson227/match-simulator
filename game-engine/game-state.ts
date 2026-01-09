import ChampionshipContainer from '../core/models/ChampionshipContainer';

export type GameState = {
  championshipContainer: ChampionshipContainer;
};

export type GameAction =
  | { type: 'INIT_CHAMPIONSHIPS'; championshipInternalName: string }
  | { type: 'PING' };
