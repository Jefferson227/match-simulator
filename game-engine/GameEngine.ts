import { GameAction, GameState } from './GameState';
import ChampionshipUseCases from '../use-cases/ChampionshipUseCases';
import TeamUseCases from '../use-cases/TeamUseCases';
import GameUseCases from '../use-cases/GameUseCases';
import MatchUseCases from '../use-cases/MatchUseCases';

type Listener = () => void;

export class GameEngine {
  private state: GameState;
  private listeners = new Set<Listener>();
  private teamUseCases: TeamUseCases;
  private championshipUseCases: ChampionshipUseCases;
  private gameUseCases: GameUseCases;
  private matchUseCases: MatchUseCases;

  constructor(initialState: GameState) {
    this.state = initialState;
    this.teamUseCases = new TeamUseCases({} as GameState);
    this.championshipUseCases = new ChampionshipUseCases({} as GameState);
    this.gameUseCases = new GameUseCases({} as GameState);
    this.matchUseCases = new MatchUseCases({} as GameState);
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  // This approach can cause unnecessary re-renders on React, since it will notify
  // React right after every change in the state.
  // In the future, consider using a library for that like Zustand or any other.
  dispatch(action: GameAction) {
    this.state = this.reduce(this.state, action);
    this.emit();
  }

  private reduce(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'INIT_CHAMPIONSHIPS':
        this.championshipUseCases = new ChampionshipUseCases(state);
        return this.championshipUseCases.initChampionships(action.championshipInternalName);
      case 'SET_ERROR_MESSAGE':
        this.gameUseCases = new GameUseCases(state);
        return this.gameUseCases.setErrorMessage(action.errorMessage);
      case 'SET_CURRENT_SCREEN':
        this.gameUseCases = new GameUseCases(state);
        return this.gameUseCases.setCurrentScreen(action.screenName);
      case 'SELECT_TEAM':
        this.teamUseCases = new TeamUseCases(state);
        return this.teamUseCases.selectTeam(action.teamId);
      case 'SET_STARTERS_AND_SUBS':
        this.teamUseCases = new TeamUseCases(state);
        return this.teamUseCases.setStartersAndSubs(action.team.id, action.starters, action.subs);
      case 'START_ROUND_FOR_ALL_CHAMPIONSHIPS':
        this.championshipUseCases = new ChampionshipUseCases(state);
        return this.championshipUseCases.startRoundForAllChampionships();
      case 'END_ROUND_FOR_ALL_CHAMPIONSHIPS':
        this.championshipUseCases = new ChampionshipUseCases(state);
        return this.championshipUseCases.endRoundForAllChampionships();
      case 'SUBSTITUTE_PLAYER':
        this.teamUseCases = new TeamUseCases(state);
        return this.teamUseCases.substitutePlayer(
          action.matchId,
          action.team.id,
          action.player.id,
          action.sub.id
        );
      case 'RUN_MATCH_ACTIONS':
        this.matchUseCases = new MatchUseCases(state);
        return this.matchUseCases.runMatchActions();
      case 'UPDATE_GAME_CONFIG':
        this.gameUseCases = new GameUseCases(state);
        return this.gameUseCases.updateClockSpeed(action.newClockSpeed);
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
