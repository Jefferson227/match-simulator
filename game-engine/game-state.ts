import ChampionshipContainer from '../core/models/ChampionshipContainer';

export type GameState = {
  currentDate: string; // TODO: Remove this
  championshipContainer: ChampionshipContainer;
};

export type GameAction = { type: 'INIT_CHAMPIONSHIPS'; championshipInternalName: string };
