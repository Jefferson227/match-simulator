import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchSimulation } from '../../hooks/useMatchSimulation';
import { useMatchContext } from '../../contexts/MatchContext';
import Score from './Score';
import TeamComponent from './TeamComponent';
import MatchDetails from './MatchDetails';
import TeamPlayers from './TeamPlayers';
import { Match, TeamSquadView } from '../../types';

interface MatchSimulatorProps {
  initialMatches?: Match[];
  onMatchEnd?: (matches: Match[]) => void;
  onTimeUpdate?: (time: number) => void;
  onGoalScored?: (match: Match, scorer: any) => void;
  onMatchStart?: (matches: Match[]) => void;
  onMatchPause?: () => void;
  onMatchResume?: () => void;
  clockSpeed?: number;
  autoStart?: boolean;
  showControls?: boolean;
  className?: string;
}

const MATCHES_PER_PAGE = 6;

const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  initialMatches = [],
  onMatchEnd,
  onTimeUpdate,
  onGoalScored,
  onMatchStart,
  onMatchPause,
  onMatchResume,
  clockSpeed = 1000,
  autoStart = false,
  showControls = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { matches, teamSquadView, setTeamSquadView, setDetailsMatchId } = useMatchContext();
  const [currentPage, setCurrentPage] = useState(0);
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null);

  const {
    time,
    isRunning,
    isFinished,
    clockSpeed: currentClockSpeed,
    startMatch,
    pauseMatch,
    resetMatch,
    changeClockSpeed,
  } = useMatchSimulation({
    initialMatches,
    onMatchEnd,
    onTimeUpdate,
    onGoalScored,
    onMatchStart,
    onMatchPause,
    onMatchResume,
    clockSpeed,
    autoStart,
  });

  // Handle clock speed changes
  const handleClockClick = () => {
    if (currentClockSpeed === 1000) {
      changeClockSpeed(500); // 0.5 seconds
    } else if (currentClockSpeed === 500) {
      changeClockSpeed(250); // 0.25 seconds
    } else {
      changeClockSpeed(1000); // Back to 1 second
    }
  };

  // Handle match details view
  const handleMatchClick = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      setDetailsMatch(match);
      setDetailsMatchId(matchId);
    }
  };

  // Handle back from details view
  const handleBackFromDetails = () => {
    setDetailsMatch(null);
    setDetailsMatchId(null);
  };

  // Calculate pagination
  const totalPages = Math.ceil(matches.length / MATCHES_PER_PAGE);
  const startIndex = currentPage * MATCHES_PER_PAGE;
  const currentMatches = matches.slice(startIndex, startIndex + MATCHES_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Reset current page when matches change
  useEffect(() => {
    setCurrentPage(0);
  }, [matches.length]);

  return (
    <div className={`match-simulator ${className}`}>
      {/* Clock and Controls */}
      {showControls && (
        <div className="clock-container mb-4">
          <div
            className="h-8 bg-yellow-400 mb-2 cursor-pointer transition-all duration-200 hover:bg-yellow-500"
            style={{ width: `${(time * 100) / 90}%` }}
            onClick={handleClockClick}
            title={`${t('match.clockSpeed')}: ${
              currentClockSpeed === 1000 ? '1x' : currentClockSpeed === 500 ? '2x' : '4x'
            }`}
          >
            <p className="m-0 pt-1 text-right pr-2 text-sm font-bold text-gray-900">
              {`${time}'`}
            </p>
          </div>
          
          <div className="flex justify-center space-x-2">
            {!isRunning ? (
              <button
                onClick={startMatch}
                disabled={isFinished}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {t('match.start')}
              </button>
            ) : (
              <button
                onClick={pauseMatch}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                {t('match.pause')}
              </button>
            )}
            <button
              onClick={resetMatch}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              {t('match.reset')}
            </button>
          </div>
        </div>
      )}

      {/* Match List */}
      {!detailsMatch && !teamSquadView && (
        <div className="match-list">
          {currentMatches.map((match) => (
            <div
              key={match.id}
              className="match-item p-4 mb-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleMatchClick(match.id)}
            >
              <div className="flex justify-between items-center">
                <TeamComponent team={match.homeTeam} />
                <Score
                  homeScore={match.homeTeam.score || 0}
                  guestScore={match.visitorTeam.score || 0}
                  className="mx-4"
                />
                <TeamComponent team={match.visitorTeam} isHome={false} />
              </div>
              {match.lastScorer && (
                <div className="text-center text-sm text-gray-600 mt-2">
                  {`${match.lastScorer.playerName} ${match.lastScorer.time}'`}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {t('common.previous')}
              </button>
              <span className="self-center">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Match Details */}
      {detailsMatch && (
        <MatchDetails
          match={detailsMatch}
          onBack={handleBackFromDetails}
        />
      )}

      {/* Team Squad View */}
      {teamSquadView && (
        <TeamPlayers
          teamSquadView={teamSquadView}
          onBack={() => setTeamSquadView(null)}
        />
      )}
    </div>
  );
};

export default MatchSimulator;
