import React, { useState } from 'react';
import { useTeamManagement } from '../../hooks';
import FormationSelector from '../FormationSelector';
import PlayerList from '../PlayerList';
import { BaseTeam as Team } from '../../../../types/team/team';
import { Player } from '../../../../types/player/player';

interface TeamManagerProps {
  team: Team;
  className?: string;
}

const TeamManager: React.FC<TeamManagerProps> = ({ team, className = '' }) => {
  const {
    players,
    formation,
    updateFormation,
    addPlayer,
    removePlayer,
    updatePlayerPosition,
    saveTeam,
    isLoading,
    error,
  } = useTeamManagement(team);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveTeam();
      if (success) {
        // Show success message or navigate away
        console.log('Team saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save team:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handlePositionChange = (playerId: string, position: string) => {
    updatePlayerPosition(playerId, position);
  };

  return (
    <div className={`team-manager ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Team: {team.name}</h2>
        
        <div className="mb-6">
          <FormationSelector 
            selectedFormation={formation}
            onFormationChange={updateFormation}
            className="max-w-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Starting XI</h3>
            <PlayerList 
              players={players.filter(p => p.position && p.position !== 'SUB')}
              onSelectPlayer={handlePlayerSelect}
              selectedPlayerId={selectedPlayer?.id}
              showPosition
              showActions
              className="border rounded-lg overflow-hidden"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Substitutes</h3>
            <PlayerList 
              players={players.filter(p => !p.position || p.position === 'SUB')}
              onSelectPlayer={handlePlayerSelect}
              selectedPlayerId={selectedPlayer?.id}
              showPosition
              showActions
              className="border rounded-lg overflow-hidden"
            />
          </div>
        </div>

        {selectedPlayer && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Player Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Name:</p>
                <p>{selectedPlayer.name}</p>
              </div>
              <div>
                <p className="font-medium">Position:</p>
                <select
                  value={selectedPlayer.position || ''}
                  onChange={(e) => handlePositionChange(selectedPlayer.id, e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select position</option>
                  <option value="GK">Goalkeeper</option>
                  <option value="DEF">Defender</option>
                  <option value="MID">Midfielder</option>
                  <option value="FWD">Forward</option>
                  <option value="SUB">Substitute</option>
                </select>
              </div>
            </div>
          </div>
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
