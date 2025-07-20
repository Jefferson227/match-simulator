import React from 'react';
import { Player } from '@types/player';
import { useTeamManagement } from '../../hooks';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer?: (player: Player) => void;
  selectedPlayerId?: string | null;
  showPosition?: boolean;
  showActions?: boolean;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onSelectPlayer,
  selectedPlayerId,
  showPosition = true,
  showActions = false,
  className = '',
}) => {
  const { removePlayer } = useTeamManagement();

  const handlePlayerClick = (player: Player) => {
    if (onSelectPlayer) {
      onSelectPlayer(player);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    removePlayer(playerId);
  };

  if (players.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        No players available
      </div>
    );
  }

  return (
    <ul className={`divide-y divide-gray-200 ${className}`}>
      {players.map((player) => (
        <li
          key={player.id}
          onClick={() => handlePlayerClick(player)}
          className={`px-4 py-3 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${
            selectedPlayerId === player.id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {player.name}
            </p>
            {showPosition && player.position && (
              <p className="text-sm text-gray-500">{player.position}</p>
            )}
          </div>
          {showActions && (
            <div className="ml-4 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => handleRemoveClick(e, player.id)}
                className="font-medium text-red-600 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default PlayerList;
