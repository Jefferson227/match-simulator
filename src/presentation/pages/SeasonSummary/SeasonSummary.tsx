import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import sampleSeasonSummary, {
  SeasonSummary as SeasonSummaryData,
  SeasonSummaryTeam,
} from './sampleSeasonSummary';

interface SeasonSummaryProps {
  summary?: SeasonSummaryData;
}

const TeamBadge: React.FC<{ team: SeasonSummaryTeam }> = ({ team }) => (
  <div
    className="inline-flex min-w-[72px] justify-center border-[3px] px-2 py-1 text-[13px]"
    style={{
      borderColor: team.colors.outline,
      backgroundColor: team.colors.background,
      color: team.colors.text,
    }}
  >
    {team.abbreviation}
  </div>
);

const Divider: React.FC = () => (
  <div style={{ height: '4px', background: '#e2e2e2', width: '100%' }} />
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[10px] text-[#c9e5c4] uppercase tracking-wider mb-2">{children}</div>
);

const TeamRow: React.FC<{ team: SeasonSummaryTeam }> = ({ team }) => (
  <div className="flex items-center gap-2">
    <TeamBadge team={team} />
    <span className="text-[12px] text-white uppercase truncate">{team.shortName}</span>
  </div>
);

const TeamList: React.FC<{ teams: SeasonSummaryTeam[]; emptyLabel: string }> = ({
  teams,
  emptyLabel,
}) =>
  teams.length > 0 ? (
    <div className="flex flex-col gap-2">
      {teams.map((team) => (
        <TeamRow key={team.abbreviation} team={team} />
      ))}
    </div>
  ) : (
    <div className="text-[11px] text-[#c9e5c4] uppercase">{emptyLabel}</div>
  );

/**
 * End of a playable season: who won each division, who went up with them and who went down.
 * One division per page, paged with the arrows.
 *
 * The data is still the hand-written sample in `sampleSeasonSummary.ts` — the page takes it as a
 * prop so a real summary built from `GameState` can replace it without touching the layout.
 */
const SeasonSummary: React.FC<SeasonSummaryProps> = ({ summary = sampleSeasonSummary }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, summary.divisions.length);
  const division = summary.divisions[Math.min(page, totalPages - 1)];

  const handlePrevPage = () => {
    if (page > 0) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage((prev) => prev + 1);
  };

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="w-[350px] mx-auto text-center">
          <div className="text-[14px] text-white mt-6 mb-2 tracking-wider uppercase">
            {summary.championshipName}
          </div>
          <div className="text-[12px] text-white mb-2 uppercase">
            {summary.season} - {division.divisionName}
          </div>
        </div>

        <div
          className="w-[350px] h-[610px] mx-auto flex flex-col"
          style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
        >
          <div className="text-[12px] text-yellow-300 text-center uppercase py-3">
            {t('seasonSummary.seasonOver')}
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.champion')}</SectionLabel>
            <TeamRow team={division.champion} />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.runnerUp')}</SectionLabel>
            <TeamRow team={division.runnerUp} />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.alsoPromoted')}</SectionLabel>
            <TeamList
              teams={division.otherPromotedTeams}
              emptyLabel={t('seasonSummary.noPromotions')}
            />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.relegated')}</SectionLabel>
            <TeamList
              teams={division.relegatedTeams}
              emptyLabel={t('seasonSummary.noRelegations')}
            />
          </div>

          <div className="flex-1 flex items-end justify-center pb-3">
            <span className="text-[10px] text-[#c9e5c4]">
              {page + 1} / {totalPages}
            </span>
          </div>
        </div>

        <div className="flex justify-between w-[350px] mt-4 mx-auto">
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[15px] bg-transparent transition ${
              page === 0
                ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
                : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
            }`}
            onClick={handlePrevPage}
            disabled={page === 0}
            aria-label="Previous"
          >
            {'<'}
          </button>
          <button
            className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[15px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
            onClick={handleNextPage}
            disabled={page >= totalPages - 1}
          >
            {t('seasonSummary.continue')}
          </button>
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[15px] bg-transparent transition ${
              page >= totalPages - 1
                ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
                : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
            }`}
            onClick={handleNextPage}
            disabled={page >= totalPages - 1}
            aria-label="Next"
          >
            {'>'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default SeasonSummary;
