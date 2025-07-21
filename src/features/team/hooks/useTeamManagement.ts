import { useState, useEffect, useCallback } from 'react';
import { Team, Player } from '../../../types';

// Import the teamService instance
import teamService from '../services/teamService';

// Re-export the Team type from the types module
export type { Team };

// Extend the Team interface to include required properties
interface TeamWithPlayers extends Team {
  players: Player[];
  formation: string;
}

interface UseTeamManagementReturn {
  // Team state
  team: TeamWithPlayers | null;
  players: Player[];
  formation: string;
  selectedPlayerId: string | null;
  isLoading: boolean;
  error: Error | null;
  
  // Team actions
  selectTeam: (team: Team | null) => Promise<void>;
  setFormation: (formation: string) => Promise<void>;
  selectPlayer: (playerId: string | null) => void;
  updatePlayerPosition: (playerId: string, position: string) => Promise<boolean>;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  saveTeam: () => Promise<boolean>;
  refreshTeam: () => Promise<void>;
  getAvailableFormations: () => Promise<string[]>;
}

const useTeamManagement = (initialTeam?: Team | null): UseTeamManagementReturn => {
  const [team, setTeam] = useState<TeamWithPlayers | null>(() => {
    if (!initialTeam) return null;
    return {
      ...initialTeam,
      players: initialTeam.players || [],
      formation: initialTeam.formation || '4-4-2'
    };
  });
  
  const [players, setPlayers] = useState<Player[]>(initialTeam?.players || []);
  const [formation, setFormationState] = useState(initialTeam?.formation || '4-4-2');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load team data
  const loadTeamData = useCallback(async (teamId: string) => {
    if (!teamId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const teamData = await teamService.getTeamById(teamId);
      if (teamData) {
        const teamWithPlayers: TeamWithPlayers = {
          ...teamData,
          players: teamData.players || [],
          formation: teamData.formation || '4-4-2'
        };
        
        setTeam(teamWithPlayers);
        setPlayers(teamWithPlayers.players);
        setFormationState(teamWithPlayers.formation);
        return teamWithPlayers;
      }
      return null;
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load team data'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (initialTeam?.id) {
      loadTeamData(initialTeam.id);
    }
  }, [initialTeam?.id, loadTeamData]);

  // Select a team to manage
  const selectTeam = useCallback(async (newTeam: Team | null) => {
    if (!newTeam) {
      setTeam(null);
      setPlayers([]);
      setFormationState('4-4-2');
      setSelectedPlayerId(null);
      return;
    }
    
    // Load team data if we have an ID, otherwise just update with the provided data
    if (newTeam.id) {
      await loadTeamData(newTeam.id);
    } else {
      const teamWithPlayers: TeamWithPlayers = {
        ...newTeam,
        players: newTeam.players || [],
        formation: newTeam.formation || '4-4-2'
      };
      setTeam(teamWithPlayers);
      setPlayers(teamWithPlayers.players);
      setFormationState(teamWithPlayers.formation);
      setSelectedPlayerId(null);
    }
  }, [loadTeamData]);

  // Update formation
  const setFormation = useCallback(async (newFormation: string) => {
    setFormationState(newFormation);
    
    if (team?.id) {
      try {
        await teamService.updateTeam(team.id, { formation: newFormation });
        setTeam(prev => prev ? { ...prev, formation: newFormation } : null);
      } catch (err) {
        console.error('Failed to update formation:', err);
        setError(err instanceof Error ? err : new Error('Failed to update formation'));
      }
    }
  }, [team?.id]);

  // Select player
  const selectPlayer = useCallback((playerId: string | null) => {
    setSelectedPlayerId(playerId);
  }, []);

  // Add player
  const addPlayer = useCallback((player: Player) => {
    setPlayers(prevPlayers => {
      // Don't add if player already exists
      if (prevPlayers.some(p => p.id === player.id)) return prevPlayers;
      return [...prevPlayers, player];
    });
  }, []);

  // Remove player
  const removePlayer = useCallback((playerId: string) => {
    setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
    // Clear selection if the selected player is removed
    setSelectedPlayerId(prevId => prevId === playerId ? null : prevId);
  }, []);

  // Update player position
  const updatePlayerPosition = useCallback(async (playerId: string, position: string): Promise<boolean> => {
    if (!playerId || !position) return false;
    
    try {
      const success = await teamService.updatePlayerPosition(playerId, position);
      if (success) {
        setPlayers(prevPlayers =>
          prevPlayers.map(player =>
            player.id === playerId ? { ...player, position } : player
          )
        );
      }
      return success;
    } catch (err) {
      console.error('Failed to update player position:', err);
      setError(err instanceof Error ? err : new Error('Failed to update player position'));
      return false;
    }
  }, []);

  // Save team
  const saveTeam = useCallback(async (): Promise<boolean> => {
    if (!team) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData = {
        ...team,
        players,
        formation
      };
      
      const success = await teamService.updateTeam(team.id, updateData);
      if (success) {
        setTeam(prev => prev ? { ...prev, ...updateData } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save team:', err);
      setError(err instanceof Error ? err : new Error('Failed to save team'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [team, players, formation]);

  // Refresh team data
  const refreshTeam = useCallback(async () => {
    if (team?.id) {
      await loadTeamData(team.id);
    }
  }, [team?.id, loadTeamData]);

  // Get available formations
  const getAvailableFormations = useCallback(async (): Promise<string[]> => {
    return teamService.getAvailableFormations();
  }, []);
  
  // Return the state and methods needed by components
  return {
    // State
    team,
    players,
    formation,
    selectedPlayerId,
    isLoading,
    error,
    
    // Actions
    selectTeam,
    setFormation,
    selectPlayer,
    updatePlayerPosition,
    addPlayer,
    removePlayer,
    saveTeam,
    refreshTeam,
    getAvailableFormations,
  };
};

export default useTeamManagement;
