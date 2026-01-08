import React, { FC, ReactNode, useMemo } from 'react';
import { MatchProvider } from '../contexts/MatchContext';
import { GeneralProvider } from '../contexts/GeneralContext';
import { ChampionshipProvider } from '../contexts/ChampionshipContext';
import { GameEngineProvider } from '../contexts/GameEngineContext';
import { createInitialGameState } from '../../game-engine/initialGameState';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  const initialState = useMemo(() => createInitialGameState(), []);

  return (
    <GameEngineProvider initialState={initialState}>
      <GeneralProvider>
        <ChampionshipProvider>
          <MatchProvider>{children}</MatchProvider>
        </ChampionshipProvider>
      </GeneralProvider>
    </GameEngineProvider>
  );
};

export default AppProviders;
