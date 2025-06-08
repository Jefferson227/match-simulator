import React, { FC, ReactNode } from 'react';
import { MatchProvider } from '../contexts/MatchContext';
import { GeneralProvider } from '../contexts/GeneralContext';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <GeneralProvider>
      <MatchProvider>{children}</MatchProvider>
    </GeneralProvider>
  );
};

export default AppProviders;
