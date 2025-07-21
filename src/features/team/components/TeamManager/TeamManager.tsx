import React, { useMemo, useState, useEffect } from 'react';
import { useTeam } from '../../contexts/TeamContext';
import FormationSelector from '../FormationSelector';
import { PlayerDetails, TeamSquad } from './components';
import type { BaseTeam as Team } from '../../../../types/team/team';
import type { Player } from '../../../../types/player/player';

interface TeamManagerProps {
  team: Team;
  className?: string;
}

const TeamManager: React.FC<TeamManagerProps> = ({ team, className = '' }) => {
  const {
    // State
    availablePlayers: players,
    selectedFormation,
    selectedPlayerId,
    isLoading,
    error,
    
    // Actions
    setFormation,
    updatePlayerPosition,
    selectPlayer,
    saveTeam,
  } = useTeam();

  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<Error | null>(null);
  
  // Set the initial team when the component mounts or team prop changes
  useEffect(() => {
    if (team) {
      selectTeam(team);
    }
  }, [team, selectTeam]);
  
  // Find the selected player from the players array
  const selectedPlayer = useMemo(() => {
    return selectedPlayerId ? players.find(p => p.id === selectedPlayerId) || null : null;
  }, [players, selectedPlayerId]);

  // Memoize filtered players to prevent unnecessary re-renders
  const { startingPlayers, substitutePlayers } = useMemo(() => ({
    startingPlayers: players.filter(p => p.position && p.position !== 'SUB'),
    substitutePlayers: players.filter(p => !p.position || p.position === 'SUB')
  }), [players]);
  
  // Handle formation change
  const handleFormationChange = async (formation: string): Promise<void> => {
    try {
      await setFormation(formation);
      setLocalError(null);
    } catch (err) {
      console.error('Failed to update formation:', err);
      setLocalError(err instanceof Error ? err : new Error('Failed to update formation'));
    }
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    setLocalError(null);
    
    try {
      const success = await saveTeam();
      if (success) {
        // TODO: Replace with proper toast notification
        console.log('Team saved successfully!');
      } else {
        throw new Error('Failed to save team');
      }
    } catch (err) {
      console.error('Failed to save team:', err);
      setLocalError(err instanceof Error ? err : new Error('Failed to save team'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayerSelect = (player: Player): void => {
    selectPlayer(player.id);
  };

  const handlePositionChange = async (playerId: string, position: string): Promise<void> => {
    try {
      const success = await updatePlayerPosition(playerId, position);
      if (!success) {
        throw new Error('Failed to update player position');
      }
    } catch (err) {
      console.error('Failed to update player position:', err);
      setLocalError(err instanceof Error ? err : new Error('Failed to update player position'));
    }
  };

  return (
    <div className={`team-manager ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Team: {team.name}</h2>
        
        <div className="mb-6">
          <FormationSelector 
            className="max-w-xs"
            selectedFormation={selectedFormation}
            onFormationChange={handleFormationChange}
            disabled={isLoading || isSaving}
          />
        </div>

        <TeamSquad 
          startingPlayers={startingPlayers}
          substitutePlayers={substitutePlayers}
          selectedPlayerId={selectedPlayer?.id}
          onPlayerSelect={handlePlayerSelect}
          className="mb-6"
        />

        {selectedPlayer && (
          <PlayerDetails 
            player={selectedPlayer}
            onPositionChange={handlePositionChange}
            className="mb-6"
          />
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Team'}
          </button>
        </div>

        {(error || localError) && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{(error || localError)?.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManager;
