import ChampionshipContainer from '../core/models/ChampionshipContainer';
import Player from '../core/models/Player';
import { Team } from '../core/models/Team';
import GameConfig from '../core/models/GameConfig';

export type GameState = {
  championshipContainer: ChampionshipContainer;
  hasError: boolean;
  errorMessage: string;
  currentScreen: string;
  gameConfig: GameConfig;
};

export type GameAction =
  | { type: 'INIT_CHAMPIONSHIPS'; championshipInternalName: string }
  | { type: 'SET_ERROR_MESSAGE'; errorMessage: string }
  | { type: 'SET_CURRENT_SCREEN'; screenName: string }
  | { type: 'SELECT_TEAM'; teamId: string }
  | { type: 'SET_STARTERS_AND_SUBS'; team: Team; starters: Player[]; subs: Player[] }
  | {
      type: 'SUBSTITUTE_PLAYER';
      team: Team;
      matchId: string;
      player: Player;
      sub: Player;
    }
  | { type: 'START_ROUND_FOR_ALL_CHAMPIONSHIPS' }
  | { type: 'END_ROUND_FOR_ALL_CHAMPIONSHIPS' }
  | { type: 'RUN_MATCH_ACTIONS' }
  | { type: 'UPDATE_GAME_CONFIG'; newClockSpeed: number }
  | { type: 'PREPARE_TEAMS_BEFORE_MATCH' }
  | { type: 'PING' };
