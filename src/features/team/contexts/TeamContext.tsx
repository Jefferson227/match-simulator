import React, { createContext, useContext, useMemo } from 'react';
import { TeamContextType } from '../types';
import { BaseTeam as Team } from '../../../types/team/team';
import useTeamManagement from '../hooks/useTeamManagement';

const TeamContext = createContext<TeamContextType | undefined>(undefined);

interface TeamProviderProps {
  initialTeam?: Team | null;
  children: React.ReactNode;
}

export const TeamProvider: React.FC<TeamProviderProps> = ({ 
  initialTeam = null, 
  children 
}) => {
  // Use the useTeamManagement hook for all team-related state management
  const {
    // State
    team: selectedTeam,
    players: availablePlayers,
    formation: selectedFormation,
    selectedPlayerId,
    isLoading,
    error,
    
    // Actions
    selectTeam: setTeam,
    setFormation,
    selectPlayer,
    updatePlayerPosition,
    addPlayer,
    removePlayer,
    saveTeam,
    refreshTeam,
    getAvailableFormations
  } = useTeamManagement(initialTeam);

  // Create the context value
  const contextValue = useMemo<TeamContextType>(() => ({
    // State
    selectedTeam,
    availablePlayers,
    selectedFormation,
    selectedPlayerId,
    isLoading: isLoading || false,
    error,
    
    // Actions
    selectTeam: setTeam,
    setFormation,
    selectPlayer,
    updatePlayerPosition,
    addPlayer,
    removePlayer,
    saveTeam,
    refreshTeam
  }), [
    // State dependencies
    selectedTeam,
    availablePlayers,
    selectedFormation,
    selectedPlayerId,
    isLoading,
    error,
    
    // Action dependencies
    setTeam,
    setFormation,
    selectPlayer,
    updatePlayerPosition,
    addPlayer,
    removePlayer,
    saveTeam,
    refreshTeam
  ]);

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};
