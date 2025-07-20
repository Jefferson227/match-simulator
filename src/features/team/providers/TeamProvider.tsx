import React from 'react';
import { TeamProvider as Provider } from '../contexts/TeamContext';
import { BaseTeam as Team } from '../../../types/team/team';

interface TeamProviderProps {
  initialTeam?: Team | null;
  children: React.ReactNode;
}

const TeamProvider: React.FC<TeamProviderProps> = ({ initialTeam = null, children }) => {
  return (
    <Provider initialTeam={initialTeam}>
      {children}
    </Provider>
  );
};

export default TeamProvider;
