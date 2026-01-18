import { GameAction, GameState } from './game-state';
import { initChampionships } from '../use-cases/ChampionshipUseCases';

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
        return {
          ...state,
          championshipContainer: initChampionships('brasileirao-serie-b'),
        };
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
