import { useSyncExternalStore } from 'react';
import type { GameEngine } from '../../game-engine/game-engine';
import type { GameState } from '../../game-engine/game-state';

export function useGameState(engine: GameEngine): GameState {
  return useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.getState()
  );
}
