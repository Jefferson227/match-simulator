import { useSyncExternalStore } from 'react';
import type { GameEngine } from '../../game-engine/GameEngine';
import type { GameState } from '../../game-engine/GameState';

export function useGameState(engine: GameEngine): GameState {
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getState()
  );
}
