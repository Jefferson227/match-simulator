import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';
import { RetirementReportEntry } from '../../../domain/models/RetirementReport';
import RetiredPlayer from '../../../domain/models/RetiredPlayer';
import RetiredCoach from '../../../domain/models/RetiredCoach';

const Divider: React.FC = () => (
  <div style={{ height: '4px', background: '#e2e2e2', width: '100%' }} />
);

const PositionBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="inline-flex self-start shrink-0 w-[40px] justify-center border-[3px] border-[#e2e2e2] py-1 text-[11px] text-white">
    {children}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 pt-3 text-[10px] text-[#c9e5c4] uppercase tracking-wider">{children}</div>
);

const EmptyLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-4 py-3 text-[11px] text-[#c9e5c4] uppercase">{children}</div>
);

/** A long name is cut short, never its age. */
const NameWithAge: React.FC<{ name: string; age: string }> = ({ name, age }) => (
  <div className="flex gap-2 text-[12px] text-white uppercase">
    <span className="truncate">{name}</span>
    <span className="shrink-0">{age}</span>
  </div>
);

/** One page of the screen: a heading and what goes under it. */
type RetirementsPage = { key: string; heading: string; content: React.ReactNode };

/**
 * The retirements of the roll-over just run, shown after every NEW SEASON. The first page is the
 * human's club — who retired, who took their place, who went into the coach pool. The rest are
 * league-wide: one page per division, top tier first, listing who retired there, then the coaches
 * who retired out of the pool.
 */
const Retirements: React.FC = () => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const report = state.lastSeasonRetirements;
  const entries = report?.entries ?? [];
  // The women's game says "técnica" where the men's says "técnico".
  const coachContext = state.leagueType === 'womens' ? 'female' : undefined;
  const age = (years: number) => t('retirements.age', { age: years });

  const humanClub = state.championshipContainer?.championships
    ?.flatMap((championship) => championship.teams)
    .find((team) => team.id === report?.teamId);
  const league = report
    ? new ChampionshipUseCases(state).getSeasonRetirements(report.season)
    : undefined;

  const handleContinue = () => {
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  const coachMarker = (
    <div className="text-[10px] text-yellow-300 uppercase">
      {t('retirements.becameCoach', { context: coachContext })}
    </div>
  );

  const renderClubEntry = ({ retired, replacement, becameCoach }: RetirementReportEntry) => (
    <div key={retired.id} data-testid="retirement-entry">
      <div className="px-4 py-3 flex gap-3">
        <PositionBadge>{t(`teamPlayers.positions.${retired.position}`)}</PositionBadge>
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div>
            <div className="text-[10px] text-[#c9e5c4] uppercase">{t('retirements.retired')}</div>
            <NameWithAge name={retired.name} age={age(retired.age)} />
          </div>
          <div>
            <div className="text-[10px] text-[#c9e5c4] uppercase">
              {t('retirements.replacedBy')}
            </div>
            <NameWithAge name={replacement.name} age={age(replacement.age)} />
          </div>
          {becameCoach && coachMarker}
        </div>
      </div>
      <Divider />
    </div>
  );

  const renderLeaguePlayer = (player: RetiredPlayer) => (
    <div key={player.id} data-testid="league-retired-player" className="px-4 py-2 flex gap-3">
      <PositionBadge>{t(`teamPlayers.positions.${player.position}`)}</PositionBadge>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <NameWithAge name={player.name} age={age(player.age)} />
        <div className="text-[10px] text-[#c9e5c4] uppercase truncate">
          {player.lastTeamShortName}
        </div>
        {player.becameCoach && coachMarker}
      </div>
    </div>
  );

  const renderCoach = (coach: RetiredCoach) => (
    <div
      key={`${coach.name}-${coach.lastTeamId ?? 'pool'}`}
      data-testid="league-retired-coach"
      className="px-4 py-2 flex flex-col gap-1"
    >
      <NameWithAge name={coach.name} age={age(coach.age)} />
      {coach.lastTeamShortName && (
        <div className="text-[10px] text-[#c9e5c4] uppercase truncate">
          {coach.lastTeamShortName}
        </div>
      )}
    </div>
  );

  const renderGroup = (players: RetiredPlayer[], coaches: RetiredCoach[]) => (
    <>
      <SectionLabel>{t('retirements.players')}</SectionLabel>
      {players.length ? (
        players.map(renderLeaguePlayer)
      ) : (
        <EmptyLabel>{t('retirements.nobodyRetired')}</EmptyLabel>
      )}
      {coaches.length > 0 && (
        <>
          <SectionLabel>{t('retirements.coaches')}</SectionLabel>
          {coaches.map(renderCoach)}
        </>
      )}
    </>
  );

  const pages: RetirementsPage[] = [
    {
      key: 'club',
      heading: humanClub?.shortName ?? '',
      content: entries.length ? (
        entries.map(renderClubEntry)
      ) : (
        <EmptyLabel>{t('retirements.nobodyRetired')}</EmptyLabel>
      ),
    },
    ...(league?.divisions ?? []).map((division) => ({
      key: division.internalName,
      heading: division.divisionName,
      content: renderGroup(division.players, division.coaches),
    })),
    ...(league?.poolCoaches.length
      ? [
          {
            key: 'pool',
            heading: t('retirements.coachPool'),
            content: league.poolCoaches.map(renderCoach),
          },
        ]
      : []),
    ...(league && (league.unplaced.players.length || league.unplaced.coaches.length)
      ? [
          {
            key: 'unplaced',
            heading: t('retirements.divisionNotRecorded'),
            content: renderGroup(league.unplaced.players, league.unplaced.coaches),
          },
        ]
      : []),
  ];

  const totalPages = pages.length;
  const current = pages[Math.min(page, totalPages - 1)];

  const navButtonClass = (disabled: boolean) =>
    `border-4 w-[80px] h-[56px] flex items-center justify-center text-[15px] bg-transparent transition ${
      disabled
        ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
        : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
    }`;

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="w-[350px] mx-auto text-center">
          <div className="text-[14px] text-white mt-6 mb-2 tracking-wider uppercase">
            {t('retirements.title')}
          </div>
          <div className="text-[12px] text-white mb-2 uppercase">{report?.season ?? ''}</div>
        </div>

        <div
          className="w-[350px] h-[610px] mx-auto flex flex-col"
          style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
        >
          <div
            className="text-[12px] text-yellow-300 text-center uppercase py-3 px-2 truncate"
            data-testid="retirements-page-heading"
          >
            {current.heading}
          </div>

          <Divider />

          <div className="flex-1 overflow-y-auto" key={current.key}>
            {current.content}
          </div>

          <div className="flex justify-center py-2">
            <span className="text-[10px] text-[#c9e5c4]">
              {page + 1} / {totalPages}
            </span>
          </div>
        </div>

        <div className="flex justify-between w-[350px] mt-4 mx-auto">
          <button
            className={navButtonClass(page === 0)}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            aria-label={t('pagination.previous')}
          >
            {'<'}
          </button>
          <button
            className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[15px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
            onClick={handleContinue}
          >
            {t('retirements.continue')}
          </button>
          <button
            className={navButtonClass(page >= totalPages - 1)}
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            aria-label={t('pagination.next')}
          >
            {'>'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Retirements;
