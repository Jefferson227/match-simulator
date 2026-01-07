import { GameAction, GameState } from './game-state';
import ChampionshipUseCases from '../use-cases/ChampionshipUseCases';

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

  dispatch(action: GameAction) {
    this.state = this.reduce(this.state, action);
    this.emit();
  }

  private reduce(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'INIT_CHAMPIONSHIPS':
        return {
          ...state,
          championshipContainer: ChampionshipUseCases.initChampionships('brasileirao-serie-b'),
        };

      default:
        return state;
    }
  }
}
