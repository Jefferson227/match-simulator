import React, { FC, ReactNode } from 'react';
import { MatchProvider } from '../contexts/MatchContext';
import { GeneralProvider } from '../contexts/GeneralContext';
import { ChampionshipProvider } from '../contexts/ChampionshipContext';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <GeneralProvider>
      <ChampionshipProvider>
        <MatchProvider>{children}</MatchProvider>
      </ChampionshipProvider>
    </GeneralProvider>
  );
};

export default AppProviders;
