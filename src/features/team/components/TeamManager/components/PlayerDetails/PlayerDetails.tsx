import React from 'react';
import { Player } from '../../../../../types/player/player';

interface PlayerDetailsProps {
  player: Player;
  onPositionChange: (playerId: string, position: string) => void;
  className?: string;
}

const PlayerDetails: React.FC<PlayerDetailsProps> = ({
  player,
  onPositionChange,
  className = '',
}) => {
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPositionChange(player.id, e.target.value);
  };

  return (
    <div className={`p-4 border rounded-lg bg-gray-50 ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Player Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-medium">Name:</p>
          <p>{player.name}</p>
        </div>
        <div>
          <p className="font-medium">Position:</p>
          <select
            value={player.position || ''}
            onChange={handlePositionChange}
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
  );
};

export default PlayerDetails;
