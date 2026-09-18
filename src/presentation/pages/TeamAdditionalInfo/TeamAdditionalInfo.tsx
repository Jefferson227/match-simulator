import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../../services/useGameState';
import { Team } from '../../../domain/models/Team';
import Match from '../../../domain/models/Match';
import ChampionshipUseCases from '../../../use-cases/ChampionshipUseCases';

const EMPTY_TEAM: Team = {
  id: '00000000-0000-0000-0000-000000000000',
  fullName: '',
  shortName: '',
  abbreviation: '',
  colors: {
    outline: '#e2e2e2',
    background: '#3c7a33',
    text: '#e2e2e2',
  },
  players: [],
  morale: 50,
  isControlledByHuman: false,
};

const TeamAdditionalInfo: React.FC = () => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const championship = new ChampionshipUseCases(state).getPlayableChampionship();
  const humanTeam = championship?.teams?.find((team) => team.isControlledByHuman) ?? EMPTY_TEAM;
  const humanStanding = championship?.standings?.find(
    (standing) => standing.team.id === humanTeam.id
  );
  const currentRound = championship?.matchContainer?.currentRound ?? 1;
  const totalRounds = championship?.matchContainer?.totalRounds ?? 0;
  const currentRoundMatches =
    championship?.matchContainer?.rounds?.find((round) => round.number === currentRound)?.matches ??
    [];

  const nextMatch = useMemo<Match | null>(() => {
    return (
      currentRoundMatches.find(
        (match) => match.homeTeam.id === humanTeam.id || match.awayTeam.id === humanTeam.id
      ) ?? null
    );
  }, [currentRoundMatches, humanTeam.id]);

  const opponentTeam = nextMatch
    ? nextMatch.homeTeam.id === humanTeam.id
      ? nextMatch.awayTeam
      : nextMatch.homeTeam
    : null;

  const opponentStanding = championship?.standings?.find(
    (standing) => standing.team.id === opponentTeam?.id
  );

  const notAvailable = t('teamAdditionalInfo.notAvailable');
  const placeText = (position: number) =>
    t('teamAdditionalInfo.place', { count: position, ordinal: true });

  const positionText = humanStanding ? placeText(humanStanding.position) : notAvailable;
  const opponentPositionText = opponentStanding
    ? placeText(opponentStanding.position)
    : notAvailable;
  const locationText = nextMatch
    ? nextMatch.homeTeam.id === humanTeam.id
      ? t('teamAdditionalInfo.home')
      : t('teamAdditionalInfo.away')
    : notAvailable;

  const moraleBarColor =
    humanTeam.morale <= 35 ? '#ef4444' : humanTeam.morale < 65 ? '#eab308' : '#22c55e';

  const handleBack = () => {
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  const renderFirstPage = () => (
    <div className="h-[31rem] flex flex-col justify-between">
      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">{t('teamAdditionalInfo.morale')}</div>
        <div className="w-full h-8 bg-[#316229] border-4 border-white my-2 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.max(0, humanTeam.morale)}%`,
              backgroundColor: moraleBarColor,
            }}
          />
        </div>
      </div>

      <button
        className="p-3 bg-black/20 border-4 border-white w-full text-left cursor-pointer hover:bg-black/30 transition-colors"
        onClick={() => engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamStandings' })}
      >
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">{t('teamAdditionalInfo.championship')}</div>
          <div className="col-span-2 text-right">{championship?.name ?? notAvailable}</div>
          <div>{t('teamAdditionalInfo.season')}</div>
          <div className="text-right">
            {championship?.matchContainer?.currentSeason ?? notAvailable}
          </div>
          <div>{t('teamAdditionalInfo.round')}</div>
          <div className="text-right">
            {t('teamAdditionalInfo.roundOf', { current: currentRound, total: totalRounds })}
          </div>
          <div>{t('teamAdditionalInfo.position')}</div>
          <div className="text-right">{positionText}</div>
        </div>
      </button>

      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">{t('teamAdditionalInfo.nextMatch')}</div>
        <div className="flex flex-col items-center">
          <div
            className="border-4 w-full mx-auto text-[17px] mb-2 flex justify-center items-center h-12 uppercase"
            style={{
              backgroundColor: opponentTeam?.colors.background ?? '#1e1e1e',
              borderColor: opponentTeam?.colors.outline ?? '#e2e2e2',
              color: opponentTeam?.colors.text ?? '#e2e2e2',
            }}
          >
            {opponentTeam?.shortName || opponentTeam?.abbreviation || notAvailable}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs opacity-80 w-full">
            <div>{t('teamAdditionalInfo.location')}</div>
            <div className="text-right">{locationText}</div>
            <div>{t('teamAdditionalInfo.position')}</div>
            <div className="text-right">{opponentPositionText}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecondPage = () => (
    <div className="h-[31rem] flex flex-col justify-between">
      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-3 text-[17px]">{t('teamAdditionalInfo.teamPerformance')}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>{t('teamAdditionalInfo.wins')}</div>
          <div className="text-right">{humanStanding?.wins ?? 0}</div>
          <div>{t('teamAdditionalInfo.draws')}</div>
          <div className="text-right">{humanStanding?.draws ?? 0}</div>
          <div>{t('teamAdditionalInfo.losses')}</div>
          <div className="text-right">{humanStanding?.losses ?? 0}</div>
          <div>{t('teamAdditionalInfo.points')}</div>
          <div className="text-right">{humanStanding?.points ?? 0}</div>
          <div>{t('teamAdditionalInfo.goalsFor')}</div>
          <div className="text-right">{humanStanding?.goalsFor ?? 0}</div>
          <div>{t('teamAdditionalInfo.goalsAgainst')}</div>
          <div className="text-right">{humanStanding?.goalsAgainst ?? 0}</div>
        </div>
      </div>

      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-3 text-[17px]">{t('teamAdditionalInfo.nextOpponent')}</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>{t('teamAdditionalInfo.team')}</div>
          <div className="text-right uppercase">
            {opponentTeam?.shortName || opponentTeam?.abbreviation || notAvailable}
          </div>
          <div>{t('teamAdditionalInfo.position')}</div>
          <div className="text-right">{opponentPositionText}</div>
          <div>{t('teamAdditionalInfo.location')}</div>
          <div className="text-right">{locationText}</div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div
        className="p-2 text-center mb-5 border-4"
        style={{
          backgroundColor: humanTeam.colors.background,
          borderColor: humanTeam.colors.outline,
          color: humanTeam.colors.text,
        }}
      >
        <h2 className="m-0 text-[17px] uppercase tracking-wider">
          {humanTeam.fullName || t('teamAdditionalInfo.teamName')}
        </h2>
      </div>

      {currentPage === 1 ? renderFirstPage() : renderSecondPage()}

      <div className="flex justify-between mt-5">
        <button
          className={`h-[70px] w-1/4 bg-transparent border-4 border-white text-white px-4 py-2 me-2 font-press-start text-[16px] transition-all ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20 active:translate-y-px'
          }`}
          onClick={() => currentPage > 1 && setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        <button
          className="h-[70px] w-1/2 bg-transparent border-4 border-white text-white px-4 py-2 mx-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={handleBack}
        >
          {t('teamAdditionalInfo.back')}
        </button>
        <button
          className={`h-[70px] w-1/4 bg-transparent border-4 border-white text-white px-4 py-2 ms-2 font-press-start text-[16px] transition-all ${
            currentPage === 2 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20 active:translate-y-px'
          }`}
          onClick={() => currentPage < 2 && setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === 2}
        >
          &gt;
        </button>
      </div>
    </MainLayout>
  );
};

export default TeamAdditionalInfo;
