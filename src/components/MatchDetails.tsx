import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Scorer } from '../types';

interface MatchDetailsProps {
  match: Match;
  scorers: (Scorer & { isHomeTeam: boolean })[];
  onBack: () => void;
}

const MatchDetails: FC<MatchDetailsProps> = ({ match, scorers, onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="font-press-start w-full max-w-[400px] mx-auto mt-8 outline outline-4 outline-white bg-[#397a33] p-4">
      <div className="flex justify-between items-center border-b-2 border-white pb-4 mb-4">
        <div className="flex items-center">
          <div
            className="w-[80px] h-[56px] flex items-center justify-center text-[28px] font-bold mr-4 outline outline-4"
            style={{
              backgroundColor: match.homeTeam.colors.background,
              color: match.homeTeam.colors.name,
              outlineColor: match.homeTeam.colors.outline,
            }}
          >
            {match.homeTeam.abbreviation}
          </div>
        </div>
        <div className="text-[28px] text-white font-bold">
          {match.homeTeam.score}x{match.visitorTeam.score}
        </div>
        <div className="flex items-center">
          <div
            className="w-[80px] h-[56px] flex items-center justify-center text-[28px] font-bold ml-4 outline outline-4"
            style={{
              backgroundColor: match.visitorTeam.colors.background,
              color: match.visitorTeam.colors.name,
              outlineColor: match.visitorTeam.colors.outline,
            }}
          >
            {match.visitorTeam.abbreviation}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-h-[180px] mb-8">
        {scorers.length === 0 ? (
          <div className="text-center text-white text-[16px]">
            {t('matchDetails.noGoals')}
          </div>
        ) : (
          scorers.map((scorer, idx) => (
            <div
              key={idx}
              className={`w-full flex ${
                scorer.isHomeTeam ? 'justify-start' : 'justify-end'
              }`}
            >
              <span className="text-white text-[16px] uppercase">
                {scorer.playerName} {scorer.time}'
              </span>
            </div>
          ))
        )}
      </div>
      <button
        className="w-full h-[58px] text-[18px] border-0 outline outline-4 outline-white bg-transparent text-white mb-2"
        onClick={onBack}
      >
        {t('matchDetails.backToMatch')}
      </button>
    </div>
  );
};

export default MatchDetails;
