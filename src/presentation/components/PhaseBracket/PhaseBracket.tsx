import React from 'react';
import { useTranslation } from 'react-i18next';
import { PhaseTieView } from '../../../domain/features/phases/PhaseView';
import { Team } from '../../../domain/models/Team';

interface PhaseBracketProps {
  ties: PhaseTieView[];
  /** Heads the ties when they are not the phase's own — Série D's promotion playoff. */
  title?: string;
}

const WINNER_CLASS = 'text-yellow-300';

/**
 * Every row of a tie shares these columns. The middle one has a fixed width, so the side columns
 * are equal on every row and each score's `x` lands on the same vertical line.
 */
const ROW_CLASS = 'grid grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)] items-center';

const TeamBadge: React.FC<{ team: Team; className?: string }> = ({ team, className }) => (
  <div
    className={`inline-flex min-w-[72px] justify-center border-[3px] px-2 py-1 ${className ?? ''}`}
    style={{
      borderColor: team.colors.outline,
      backgroundColor: team.colors.background,
      color: team.colors.text,
    }}
  >
    {team.abbreviation}
  </div>
);

interface ScoreProps {
  home: number | string;
  away: number | string;
  homeClassName?: string;
  awayClassName?: string;
  testId: string;
}

/** `home x away`, symmetric around the `x` so it centres exactly in the middle column. */
const Score: React.FC<ScoreProps> = ({ home, away, homeClassName, awayClassName, testId }) => (
  <span className="justify-self-center grid grid-cols-[2ch_1ch_2ch] gap-x-[1ch]">
    <span className={`text-right ${homeClassName ?? ''}`} data-testid={`${testId}-home`}>
      {home}
    </span>{' '}
    <span className="text-center">x</span>{' '}
    <span className={`text-left ${awayClassName ?? ''}`} data-testid={`${testId}-away`}>
      {away}
    </span>
  </span>
);

/**
 * A knockout phase's ties: the aggregate, both legs, and the shootout when the tie needed one. Every
 * score reads in the tie's own order — first-leg home club on the left — so a second leg's score is
 * flipped from its home/away sides. The winner's aggregate (and shootout) score is painted yellow.
 *
 * Ties are keyed by `tieId`, never by `Match.id` — match ids are not unique under test, where
 * `crypto.randomUUID` is stubbed to a constant.
 */
const PhaseBracket: React.FC<PhaseBracketProps> = ({ ties, title }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full px-2" data-testid="phase-bracket">
      {title && (
        <div className="mb-3 text-center text-[12px] text-yellow-300" data-testid="bracket-title">
          {title}
        </div>
      )}
      {ties.map((tie) => {
        const homeClassName = tie.winnerTeamId === tie.homeTeam.id ? WINNER_CLASS : undefined;
        const awayClassName = tie.winnerTeamId === tie.awayTeam.id ? WINNER_CLASS : undefined;

        // A shootout is taken at the deciding (last) leg, so its home side is that leg's host.
        const decidingLeg = tie.legs[tie.legs.length - 1];
        const shootoutFlipped = decidingLeg?.homeTeam.id !== tie.homeTeam.id;

        return (
          <div key={tie.tieId} className="mb-4 border-b-4 border-[#e2e2e2] pb-2" data-testid="tie">
            <div className={`${ROW_CLASS} mb-2 text-[16px] text-white`} data-testid="tie-aggregate">
              <TeamBadge team={tie.homeTeam} className="justify-self-start" />{' '}
              <Score
                testId="tie-aggregate"
                home={tie.aggregate.home}
                away={tie.aggregate.away}
                homeClassName={homeClassName}
                awayClassName={awayClassName}
              />{' '}
              <TeamBadge team={tie.awayTeam} className="justify-self-end" />
            </div>

            {tie.legs.map((leg) => {
              const sameOrder = leg.homeTeam.id === tie.homeTeam.id;
              const homeScore = sameOrder ? leg.homeTeamScore : leg.awayTeamScore;
              const awayScore = sameOrder ? leg.awayTeamScore : leg.homeTeamScore;

              return (
                <div
                  key={`${tie.tieId}-leg-${leg.leg}`}
                  className={`${ROW_CLASS} text-[12px] text-[#e2e2e2]`}
                  data-testid="tie-leg"
                >
                  <span className="text-[10px] whitespace-nowrap">
                    {t('standings.legOf', { current: leg.leg, total: tie.legs.length })}
                  </span>{' '}
                  <Score
                    testId="tie-leg"
                    home={leg.played ? homeScore : '-'}
                    away={leg.played ? awayScore : '-'}
                  />
                </div>
              );
            })}

            {tie.shootout && (
              <div className={`${ROW_CLASS} text-[12px] text-[#e2e2e2]`} data-testid="tie-shootout">
                <span className="text-[10px] whitespace-nowrap">{t('standings.penalties')}</span>{' '}
                <Score
                  testId="tie-shootout"
                  home={shootoutFlipped ? tie.shootout.awayScore : tie.shootout.homeScore}
                  away={shootoutFlipped ? tie.shootout.homeScore : tie.shootout.awayScore}
                  homeClassName={homeClassName}
                  awayClassName={awayClassName}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhaseBracket;
