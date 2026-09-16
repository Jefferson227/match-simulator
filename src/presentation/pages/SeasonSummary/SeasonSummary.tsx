import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import {
  SeasonSummary as SeasonSummaryData,
  SeasonSummaryDivision,
  SeasonSummaryTeam,
} from '../../../domain/models/SeasonSummary';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';

interface SeasonSummaryProps {
  summary?: SeasonSummaryData;
}

const EMPTY_SUMMARY: SeasonSummaryData = { season: 0, divisions: [] };

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

const EmptyLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] text-[#c9e5c4] uppercase">{children}</div>
);

const TeamRow: React.FC<{ team: SeasonSummaryTeam }> = ({ team }) => (
  <div className="flex items-center gap-2">
    <TeamBadge team={team} />
    <span className="text-[12px] text-white uppercase truncate">{team.shortName}</span>
  </div>
);

/**
 * A promotion or relegation list.
 *
 * The three states are distinct: a list of clubs, nothing to show because the division has no
 * neighbour on that side, and nothing to show because the container never worked that exchange out
 * (`teams` undefined). The last one is a gap in the engine, not a result, so it says so rather than
 * claiming the division is the top or bottom of the pyramid.
 */
const TeamList: React.FC<{
  teams?: SeasonSummaryTeam[];
  hasNeighbourDivision: boolean;
  noNeighbourLabel: string;
  noneLabel: string;
  notTrackedLabel: string;
}> = ({ teams, hasNeighbourDivision, noNeighbourLabel, noneLabel, notTrackedLabel }) => {
  if (teams === undefined) return <EmptyLabel>{notTrackedLabel}</EmptyLabel>;
  if (teams.length === 0) {
    return <EmptyLabel>{hasNeighbourDivision ? noneLabel : noNeighbourLabel}</EmptyLabel>;
  }

  return (
    <div className="flex flex-col gap-2">
      {teams.map((team) => (
        <TeamRow key={team.id} team={team} />
      ))}
    </div>
  );
};

const PlacedTeam: React.FC<{ team?: SeasonSummaryTeam; emptyLabel: string }> = ({
  team,
  emptyLabel,
}) => (team ? <TeamRow team={team} /> : <EmptyLabel>{emptyLabel}</EmptyLabel>);

/**
 * End of a playable season: who won each division, who went up with them and who went down.
 * One division per page, paged with the arrows.
 *
 * The summary is built by `BUILD_SEASON_SUMMARY` when TeamStandings ends the season, because the
 * roll-over this page's NEW SEASON runs resets the tables it is read off. It stays a prop so a
 * caller can render a summary of its own.
 */
const SeasonSummary: React.FC<SeasonSummaryProps> = ({ summary: propSummary }) => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const summary = propSummary ?? state.seasonSummary ?? EMPTY_SUMMARY;

  const totalPages = Math.max(1, summary.divisions.length);
  const division = summary.divisions[Math.min(page, totalPages - 1)] as
    SeasonSummaryDivision | undefined;

  const handlePrevPage = () => {
    if (page > 0) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage((prev) => prev + 1);
  };

  // Everything TeamStandings used to do on NEW SEASON, now that the summary has been read: roll the
  // divisions over, refresh the stats off the new squads and hand the player back to TeamManager.
  const handleNewSeason = () => {
    engine.dispatch({ type: 'RUN_END_OF_CHAMPIONSHIP_ACTIONS' });
    engine.dispatch({ type: 'UPDATE_TEAM_STATS' });
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
    engine.dispatch({ type: 'SAVE_GAME' });
  };

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="w-[350px] mx-auto text-center">
          <div className="text-[14px] text-white mt-6 mb-2 tracking-wider uppercase">
            {division?.divisionName ?? ''}
          </div>
          <div className="text-[12px] text-white mb-2 uppercase">{summary.season}</div>
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
            <PlacedTeam team={division?.champion} emptyLabel={t('seasonSummary.notTracked')} />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.runnerUp')}</SectionLabel>
            <PlacedTeam team={division?.runnerUp} emptyLabel={t('seasonSummary.notTracked')} />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.alsoPromoted')}</SectionLabel>
            <TeamList
              teams={division?.otherPromotedTeams}
              hasNeighbourDivision={division?.isPromotable ?? false}
              noNeighbourLabel={t('seasonSummary.noPromotions')}
              noneLabel={t('seasonSummary.nobodyElsePromoted')}
              notTrackedLabel={t('seasonSummary.notTracked')}
            />
          </div>

          <Divider />

          <div className="px-4 py-4">
            <SectionLabel>{t('seasonSummary.relegated')}</SectionLabel>
            <TeamList
              teams={division?.relegatedTeams}
              hasNeighbourDivision={division?.isRelegatable ?? false}
              noNeighbourLabel={t('seasonSummary.noRelegations')}
              noneLabel={t('seasonSummary.nobodyRelegated')}
              notTrackedLabel={t('seasonSummary.notTracked')}
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
            onClick={handleNewSeason}
          >
            {t('seasonSummary.newSeason')}
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
