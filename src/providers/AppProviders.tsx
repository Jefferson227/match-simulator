import React, { FC, ReactNode } from 'react';
import { MatchProvider } from '../contexts/MatchContext';

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return <MatchProvider>{children}</MatchProvider>;
};

export default AppProviders;
