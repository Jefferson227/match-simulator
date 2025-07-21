import React from 'react';
import { Player } from '../../../../../../types/player/player';
import PlayerList from '../../../../../PlayerList/PlayerList';

interface TeamSquadProps {
  startingPlayers: Player[];
  substitutePlayers: Player[];
  selectedPlayerId?: string;
  onPlayerSelect: (player: Player) => void;
  className?: string;
}

const TeamSquad: React.FC<TeamSquadProps> = ({
  startingPlayers,
  substitutePlayers,
  selectedPlayerId,
  onPlayerSelect,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold mb-3">Starting XI</h3>
        <PlayerList 
          players={startingPlayers}
          onSelectPlayer={onPlayerSelect}
          selectedPlayerId={selectedPlayerId}
          showPosition
          showActions
          className="border rounded-lg overflow-hidden"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Substitutes</h3>
        <PlayerList 
          players={substitutePlayers}
          onSelectPlayer={onPlayerSelect}
          selectedPlayerId={selectedPlayerId}
          showPosition
          showActions
          className="border rounded-lg overflow-hidden"
        />
      </div>
    </div>
  );
};

export default TeamSquad;
