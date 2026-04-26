import { FC, ReactNode, useMemo } from 'react';
import { GameEngineProvider } from '../contexts/GameEngineContext';
import { createInitialGameState } from '../../game-engine/initialGameState';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  const initialState = useMemo(() => createInitialGameState(), []);

  return <GameEngineProvider initialState={initialState}>{children}</GameEngineProvider>;
};

export default AppProviders;
