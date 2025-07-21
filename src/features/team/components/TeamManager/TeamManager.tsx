import React, { useMemo, useState } from 'react';
import { useTeamManagement } from '../../hooks';
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
    players,
    updatePlayerPosition,
    saveTeam,
    isLoading,
    error,
  } = useTeamManagement(team);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Memoize filtered players to prevent unnecessary re-renders
  const { startingPlayers, substitutePlayers } = useMemo(() => ({
    startingPlayers: players.filter(p => p.position && p.position !== 'SUB'),
    substitutePlayers: players.filter(p => !p.position || p.position === 'SUB')
  }), [players]);

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const success = await saveTeam();
      if (success) {
        // TODO: Replace with proper toast notification
        console.log('Team saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save team:', err);
      // Error is already handled in the hook
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayerSelect = (player: Player): void => {
    setSelectedPlayer(player);
  };

  const handlePositionChange = (playerId: string, position: string): void => {
    updatePlayerPosition(playerId, position);
    // Update the selected player's position if it's the currently selected one
    if (selectedPlayer?.id === playerId) {
      setSelectedPlayer({ ...selectedPlayer, position });
    }
  };

  return (
    <div className={`team-manager ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Team: {team.name}</h2>
        
        <div className="mb-6">
          <FormationSelector 
            className="max-w-xs"
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

        {error && (
          <div className="mt-4 text-sm text-red-600">
            Error: {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManager;
