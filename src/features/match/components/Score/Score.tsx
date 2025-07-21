import React from 'react';

interface ScoreProps {
  homeScore: number;
  guestScore: number;
  onClick?: () => void;
  className?: string;
}

const Score: React.FC<ScoreProps> = ({
  homeScore,
  guestScore,
  onClick,
  className = '',
}) => {
  return (
    <div 
      className={`score-container flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      <div className="score bg-gray-800 text-white font-bold text-lg px-4 py-1 rounded">
        <span className="home-score">{homeScore}</span>
        <span className="mx-1">-</span>
        <span className="guest-score">{guestScore}</span>
      </div>
      {onClick && (
        <button 
          className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Details
        </button>
      )}
    </div>
  );
};

export default Score;
