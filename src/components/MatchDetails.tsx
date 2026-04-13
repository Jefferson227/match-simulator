import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import utils from '../utils/utils';
import Match from '../domain/models/Match';
import Scorer from '../domain/models/Scorer';

interface MatchDetailsProps {
  match: Match;
  scorers: Scorer[];
  onBack: () => void;
}

const MatchDetails: FC<MatchDetailsProps> = ({ match, scorers, onBack }) => {
  const { t } = useTranslation();
  return (
    <div className="font-press-start w-[350px] h-[596px] mx-auto mt-8 outline outline-4 outline-white bg-[#397a33] p-4">
      <div className="flex justify-between items-center border-b-3 border-white pb-4 mb-4">
        <div className="flex items-center">
          <div
            className="w-[95px] h-[58px] border-[4px] box-content flex items-center justify-center text-[22px] mr-4"
            style={{
              backgroundColor: match.homeTeam.colors.background,
              color: match.homeTeam.colors.text,
              borderColor: match.homeTeam.colors.outline,
            }}
          >
            {match.homeTeam.abbreviation}
          </div>
        </div>

        <div className="flex items-center text-[22px] text-white">
          <div>{match.homeTeamScore}</div>
          <div className="mx-[2px]">x</div>
          <div>{match.awayTeamScore}</div>
        </div>

        <div className="flex items-center">
          <div
            className="w-[95px] h-[58px] border-[4px] box-content flex items-center justify-center text-[22px] ml-4"
            style={{
              backgroundColor: match.awayTeam.colors.background,
              color: match.awayTeam.colors.text,
              borderColor: match.awayTeam.colors.outline,
            }}
          >
            {match.awayTeam.abbreviation}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-[374px] mb-8">
        {scorers.length === 0 ? (
          <div className="text-center text-white text-[16px]">{t('matchDetails.noGoals')}</div>
        ) : (
          scorers.map((scorer, idx) => (
            <div
              key={idx}
              className={`w-full flex ${scorer.scorerTeam === 'home' ? 'justify-start' : 'justify-end'}`}
            >
              <span className="text-white text-[16px] uppercase">
                {utils.shortenPlayerName(scorer.player.name)} {scorer.time}'
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
