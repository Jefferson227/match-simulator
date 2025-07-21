import React from 'react';
import { MatchTeam } from '../../types';

interface TeamComponentProps {
  team: MatchTeam;
  isHome?: boolean;
  onClick?: () => void;
  className?: string;
}

const TeamComponent: React.FC<TeamComponentProps> = ({
  team,
  isHome = true,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`team-component flex items-center ${isHome ? 'flex-row' : 'flex-row-reverse text-right'} ${className}`}
      onClick={handleClick}
    >
      <div className="team-logo w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-2">
        {team.logo ? (
          <img 
            src={team.logo} 
            alt={team.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-bold text-gray-600">
            {team.name.substring(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="team-info">
        <h3 className="team-name font-medium text-sm md:text-base">
          {team.name}
        </h3>
        {team.manager && (
          <p className="team-manager text-xs text-gray-500">
            {team.manager}
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamComponent;
