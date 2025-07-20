import { FC, ReactNode, useContext } from 'react';
import { MatchProvider } from '../contexts/MatchContext';
import { GeneralProvider } from '../contexts/GeneralContext';
import { GeneralContext } from '../contexts/GeneralContext';
import { ChampionshipProvider } from '../contexts/ChampionshipContext';
import { TeamProvider } from '../features/team/providers';

interface AppProvidersProps {
  children: ReactNode;
}

// Component to access GeneralContext and provide team data to TeamProvider
const TeamManager: FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useContext(GeneralContext);
  const baseTeam = state.baseTeam;
  
  return (
    <TeamProvider initialTeam={baseTeam || undefined}>
      {children}
    </TeamProvider>
  );
};

const AppProviders: FC<AppProvidersProps> = ({ children }) => {
  return (
    <GeneralProvider>
      <ChampionshipProvider>
        <MatchProvider>
          <TeamManager>
            {children}
          </TeamManager>
        </MatchProvider>
      </ChampionshipProvider>
    </GeneralProvider>
  );
};

export default AppProviders;
