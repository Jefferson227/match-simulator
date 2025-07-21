import React from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Scorer } from '../../types';
import TeamComponent from '../TeamComponent';
import Score from '../Score';

interface MatchDetailsProps {
  match: Match;
  onBack: () => void;
  className?: string;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({
  match,
  onBack,
  className = '',
}) => {
  const { t } = useTranslation();
  const { homeTeam, visitorTeam, scorers = [], date } = match;

  // Group scorers by team
  const homeScorers = scorers.filter((scorer) => scorer.isHomeTeam);
  const awayScorers = scorers.filter((scorer) => !scorer.isHomeTeam);

  // Sort scorers by time
  const sortScorers = (scorers: Scorer[]) =>
    [...scorers].sort((a, b) => a.time - b.time);

  return (
    <div className={`match-details ${className}`}>
      <button
        onClick={onBack}
        className="mb-4 text-blue-500 hover:text-blue-700 flex items-center"
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

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Match Header */}
        <div className="match-header mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">
              {t('match.matchDetails')} - {t('match.round')} {match.round}
            </h2>
            <span className="text-sm text-gray-500">
              {date && new Date(date).toLocaleDateString()}
            </span>
          </div>

          {/* Teams and Score */}
          <div className="flex justify-between items-center mb-6">
            <TeamComponent team={homeTeam} className="flex-1" />
            <div className="mx-4">
              <Score
                homeScore={homeTeam.score || 0}
                guestScore={visitorTeam.score || 0}
                className="text-3xl"
              />
            </div>
            <TeamComponent team={visitorTeam} isHome={false} className="flex-1" />
          </div>
        </div>

        {/* Match Stats */}
        <div className="match-stats grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="stat-card bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{t('match.ballPossession')}</h3>
            <div className="flex items-center">
              <div className="w-1/2 text-center">
                <div className="text-2xl font-bold">
                  {homeTeam.possession || 50}%
                </div>
                <div className="text-sm text-gray-500">{homeTeam.name}</div>
              </div>
              <div className="w-1/2 text-center">
                <div className="text-2xl font-bold">
                  {visitorTeam.possession || 50}%
                </div>
                <div className="text-sm text-gray-500">{visitorTeam.name}</div>
              </div>
            </div>
          </div>

          <div className="stat-card bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{t('match.shots')}</h3>
            <div className="flex items-center">
              <div className="w-1/2 text-center">
                <div className="text-2xl font-bold">
                  {homeTeam.shotAttempts || 0}
                </div>
                <div className="text-sm text-gray-500">{t('match.attempts')}</div>
              </div>
              <div className="w-1/2 text-center">
                <div className="text-2xl font-bold">
                  {homeTeam.shotsOnTarget || 0}
                </div>
                <div className="text-sm text-gray-500">{t('match.onTarget')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scorers */}
        <div className="scorers">
          <h3 className="font-semibold mb-4">{t('match.goals')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">{homeTeam.name}</h4>
              {homeScorers.length > 0 ? (
                <ul className="space-y-2">
                  {sortScorers(homeScorers).map((scorer, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{scorer.playerName}</span>
                      <span className="text-gray-500">{scorer.time}'</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t('match.noGoals')}</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">{visitorTeam.name}</h4>
              {awayScorers.length > 0 ? (
                <ul className="space-y-2">
                  {sortScorers(awayScorers).map((scorer, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{scorer.playerName}</span>
                      <span className="text-gray-500">{scorer.time}'</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">{t('match.noGoals')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Match Events */}
        {scorers.length > 0 && (
          <div className="match-events mt-8">
            <h3 className="font-semibold mb-4">{t('match.matchEvents')}</h3>
            <div className="timeline relative">
              <div className="absolute left-1/2 w-0.5 h-full bg-gray-200 -ml-px"></div>
              <div className="space-y-4">
                {sortScorers(scorers).map((scorer, index) => (
                  <div
                    key={index}
                    className={`relative pl-8 ${
                      scorer.isHomeTeam ? 'text-left' : 'text-right pr-8'
                    }`}
                  >
                    <div className="absolute top-0 w-4 h-4 bg-blue-500 rounded-full -left-2"></div>
                    <div
                      className={`inline-block p-2 rounded-lg ${
                        scorer.isHomeTeam ? 'bg-blue-50' : 'bg-green-50'
                      }`}
                    >
                      <span className="font-medium">{scorer.playerName}</span>
                      <span className="text-gray-500 text-sm ml-2">
                        {scorer.time}'
                      </span>
                      {scorer.isPenalty && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          {t('match.penalty')}
                        </span>
                      )}
                      {scorer.isOwnGoal && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          {t('match.ownGoal')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetails;
