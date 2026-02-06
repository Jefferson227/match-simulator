import { GameAction, GameState } from './game-state';
import { initChampionships } from '../use-cases/ChampionshipUseCases';
import * as TeamUseCases from '../use-cases/TeamUseCases';

type Listener = () => void;

export class GameEngine {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor(initialState: GameState) {
    this.state = initialState;
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
        const result = initChampionships(action.championshipInternalName);
        if (!result.succeeded) {
          return {
            ...state,
            hasError: true,
            errorMessage: result.error.message,
          };
        }

        return {
          ...state,
          championshipContainer: result.getResult(),
        };
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
        // TODO: Change selecting team by id instead of the internal name, because it doesn't exist in the type Team
        const selectTeamResult = TeamUseCases.selectTeam(
          state.championshipContainer.playableChampionship,
          action.selectedTeamInternalName
        );

        if (!selectTeamResult.succeeded) {
          return {
            ...state,
            hasError: true,
            errorMessage: selectTeamResult.error.message,
          };
        }

        return {
          ...state,
          championshipContainer: {
            ...state.championshipContainer,
            playableChampionship: selectTeamResult.getResult(),
          },
        };
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
