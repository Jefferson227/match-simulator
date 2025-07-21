import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TeamSquadView, MatchTeam } from '../../types';

interface TeamPlayersProps {
  teamSquadView: TeamSquadView;
  onBack: () => void;
  className?: string;
}

const TeamPlayers: React.FC<TeamPlayersProps> = ({
  teamSquadView,
  onBack,
  className = '',
}) => {
  const { t } = useTranslation();
  const { team, isHomeTeam } = teamSquadView;
  const [selectedPlayer, setSelectedPlayer] = useState<{
    id: string;
    name: string;
    position: string;
  } | null>(null);
  const [substitutePlayer, setSubstitutePlayer] = useState<{
    id: string;
    name: string;
    position: string;
  } | null>(null);

  // Get starting lineup and substitutes
  const lineup = team.players?.filter((player) => player.position !== 'SUB') || [];
  const substitutes =
    team.players?.filter((player) => player.position === 'SUB') || [];

  const handlePlayerSelect = (player: any) => {
    if (selectedPlayer?.id === player.id) {
      setSelectedPlayer(null);
    } else {
      setSelectedPlayer({
        id: player.id,
        name: player.name,
        position: player.position,
      });
    }
  };

  const handleSubstituteSelect = (player: any) => {
    if (substitutePlayer?.id === player.id) {
      setSubstitutePlayer(null);
    } else {
      setSubstitutePlayer({
        id: player.id,
        name: player.name,
        position: player.position,
      });
    }
  };

  const handleSubstitution = () => {
    if (selectedPlayer && substitutePlayer) {
      // In a real implementation, this would dispatch an action to update the team
      console.log('Substitution:', {
        playerOut: selectedPlayer,
        playerIn: substitutePlayer,
      });
      
      // Reset selection
      setSelectedPlayer(null);
      setSubstitutePlayer(null);
      
      // Close the squad view
      onBack();
    }
  };

  const renderPlayerItem = (player: any, isSubstitute = false) => {
    const isSelected = selectedPlayer?.id === player.id;
    const isSubSelected = substitutePlayer?.id === player.id;
    
    return (
      <div
        key={player.id}
        onClick={() =>
          isSubstitute
            ? handleSubstituteSelect(player)
            : handlePlayerSelect(player)
        }
        className={`p-2 border rounded mb-2 flex justify-between items-center cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-100 border-blue-500'
            : isSubSelected
            ? 'bg-green-100 border-green-500'
            : 'hover:bg-gray-50'
        }`}
      >
        <div>
          <div className="font-medium">{player.name}</div>
          <div className="text-sm text-gray-500">
            {player.position} • {player.rating || 'N/A'}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">{player.number || '--'}</div>
          <div className="text-xs text-gray-500">
            {player.fitness || '100%'} fit
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`team-players ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className="text-blue-500 hover:text-blue-700 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {t('common.back')}
        </button>
        <h2 className="text-xl font-bold">
          {team.name} - {t('team.squad')}
        </h2>
        <div className="w-24"></div> {/* For alignment */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Starting Lineup */}
        <div>
          <h3 className="font-semibold text-lg mb-3">
            {t('team.startingLineup')}
          </h3>
          {lineup.length > 0 ? (
            <div className="space-y-2">
              {lineup.map((player) => renderPlayerItem(player))}
            </div>
          ) : (
            <p className="text-gray-500">{t('team.noPlayers')}</p>
          )}
        </div>

        {/* Substitutes */}
        <div>
          <h3 className="font-semibold text-lg mb-3">
            {t('team.substitutes')} ({substitutes.length}/5)
          </h3>
          {substitutes.length > 0 ? (
            <div className="space-y-2">
              {substitutes.map((player) => renderPlayerItem(player, true))}
            </div>
          ) : (
            <p className="text-gray-500">{t('team.noSubstitutes')}</p>
          )}
        </div>
      </div>

      {/* Substitution Controls */}
      {(selectedPlayer || substitutePlayer) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-3">{t('team.makeSubstitution')}</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              {selectedPlayer ? (
                <div>
                  <div className="font-medium">{selectedPlayer.name}</div>
                  <div className="text-sm text-gray-500">
                    {t('team.position')}: {selectedPlayer.position}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  {t('team.selectPlayerToReplace')}
                </div>
              )}
            </div>

            <div className="mx-4 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>

            <div className="text-center flex-1">
              {substitutePlayer ? (
                <div>
                  <div className="font-medium">{substitutePlayer.name}</div>
                  <div className="text-sm text-gray-500">
                    {t('team.position')}: {substitutePlayer.position}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  {t('team.selectSubstitute')}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubstitution}
              disabled={!selectedPlayer || !substitutePlayer}
              className={`px-4 py-2 rounded ${
                selectedPlayer && substitutePlayer
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('team.confirmSubstitution')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPlayers;
