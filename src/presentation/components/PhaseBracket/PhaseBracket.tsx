import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhaseTieView } from '../../../domain/features/phases/PhaseView';

interface PhaseBracketProps {
  ties: PhaseTieView[];
}

/**
 * A knockout phase's ties: both legs, the aggregate, and the shootout when the tie needed one.
 *
 * Ties are keyed by `tieId`, never by `Match.id` — match ids are not unique under test, where
 * `crypto.randomUUID` is stubbed to a constant.
 */
const PhaseBracket: React.FC<PhaseBracketProps> = ({ ties }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full px-2" data-testid="phase-bracket">
      {ties.map((tie) => {
        const homeAdvances = tie.winnerTeamId === tie.homeTeam.id;
        const awayAdvances = tie.winnerTeamId === tie.awayTeam.id;

        return (
          <div key={tie.tieId} className="mb-4 border-b-4 border-[#e2e2e2] pb-2" data-testid="tie">
            <div className="flex justify-between text-[16px] text-white">
              <span className={homeAdvances ? 'text-yellow-300' : undefined}>
                {tie.homeTeam.abbreviation}
                {homeAdvances ? ` ${t('standings.advances')}` : ''}
              </span>
              <span>
                {t('standings.aggregate')} {tie.aggregate.home}-{tie.aggregate.away}
              </span>
              <span className={awayAdvances ? 'text-yellow-300' : undefined}>
                {tie.awayTeam.abbreviation}
                {awayAdvances ? ` ${t('standings.advances')}` : ''}
              </span>
            </div>

            {tie.legs.map((leg) => (
              <div
                key={`${tie.tieId}-leg-${leg.leg}`}
                className="flex justify-between text-[12px] text-[#e2e2e2]"
              >
                <span>{t('standings.legOf', { current: leg.leg, total: tie.legs.length })}</span>
                <span>
                  {leg.homeTeam.abbreviation} {leg.played ? leg.homeTeamScore : '-'}
                  {' x '}
                  {leg.played ? leg.awayTeamScore : '-'} {leg.awayTeam.abbreviation}
                </span>
              </div>
            ))}

            {tie.shootout && (
              <div className="text-[12px] text-yellow-300" data-testid="tie-shootout">
                {t('standings.penalties')} {tie.shootout.homeScore}-{tie.shootout.awayScore}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhaseBracket;
