import { GameAction, GameState } from './game-state';
import ChampionshipUseCases from '../use-cases/ChampionshipUseCases';
import TeamUseCases from '../use-cases/TeamUseCases';

type Listener = () => void;

export class GameEngine {
  private state: GameState;
  private listeners = new Set<Listener>();
  private teamUseCases: TeamUseCases;
  private championshipUseCases: ChampionshipUseCases;

  constructor(initialState: GameState) {
    this.state = initialState;
    this.teamUseCases = new TeamUseCases({} as GameState);
    this.championshipUseCases = new ChampionshipUseCases({} as GameState);
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
        return {
          ...state,
          hasError: true,
          errorMessage: action.errorMessage,
        };
      case 'SET_CURRENT_SCREEN':
        return {
          ...state,
          currentScreen: action.screenName,
        };
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
        // TODO: Implement logic to end the rounds for all championships (playableChampionship, relegationChampionship, promotionChampionship)
        // - For each championship:
        //  - Get the current round
        //  - Set the current round status as 'finished'
        //  - Increase the number of the round by +1
        console.log('Round ended.');
        return state;
      case 'SUBSTITUTE_PLAYER':
        this.teamUseCases = new TeamUseCases(state);
        return this.teamUseCases.substitutePlayer(
          action.matchId,
          action.team.id,
          action.player.id,
          action.sub.id
        );
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
