import React, { createContext, useContext, useMemo } from 'react';
import { GameEngine } from '../../game-engine/game-engine';
import type { GameState } from '../../game-engine/game-state';

const GameEngineContext = createContext<GameEngine | null>(null);

export function GameEngineProvider({
  initialState,
  children,
}: {
  initialState: GameState;
  children: React.ReactNode;
}) {
  const engine = useMemo(() => new GameEngine(initialState), [initialState]);

  return <GameEngineContext.Provider value={engine}>{children}</GameEngineContext.Provider>;
}

export function useGameEngine(): GameEngine {
  const engine = useContext(GameEngineContext);
  if (!engine) throw new Error('useGameEngine must be used within GameEngineProvider');
  return engine;
}
