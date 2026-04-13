import React, { useMemo, useState } from 'react';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import { Team } from '../../domain/models/Team';
import Match from '../../domain/models/Match';

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
  const [currentPage, setCurrentPage] = useState(1);

  const championship = state.championshipContainer.playableChampionship;
  const humanTeam =
    championship?.teams?.find((team) => team.isControlledByHuman) ?? EMPTY_TEAM;
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

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'ST';
    if (j === 2 && k !== 12) return 'ND';
    if (j === 3 && k !== 13) return 'RD';
    return 'TH';
  };

  const positionText = humanStanding
    ? `${humanStanding.position}${getOrdinalSuffix(humanStanding.position)} PLACE`
    : 'N/A';
  const opponentPositionText = opponentStanding
    ? `${opponentStanding.position}${getOrdinalSuffix(opponentStanding.position)} PLACE`
    : 'N/A';

  const moraleBarColor =
    humanTeam.morale <= 35 ? '#ef4444' : humanTeam.morale < 65 ? '#eab308' : '#22c55e';

  const handleBack = () => {
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  const renderFirstPage = () => (
    <div className="h-[31rem] flex flex-col justify-between">
      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">MORALE</div>
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
          <div>CHAMPIONSHIP</div>
          <div className="text-right">{championship?.name ?? 'N/A'}</div>
          <div>SEASON</div>
          <div className="text-right">{championship?.matchContainer?.currentSeason ?? 'N/A'}</div>
          <div>ROUND</div>
          <div className="text-right">{`${currentRound} OF ${totalRounds}`}</div>
          <div>POSITION</div>
          <div className="text-right">{positionText}</div>
        </div>
      </button>

      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-2 text-[17px]">NEXT MATCH</div>
        <div className="flex flex-col items-center">
          <div
            className="border-4 w-full mx-auto text-[17px] mb-2 flex justify-center items-center h-12 uppercase"
            style={{
              backgroundColor: opponentTeam?.colors.background ?? '#1e1e1e',
              borderColor: opponentTeam?.colors.outline ?? '#e2e2e2',
              color: opponentTeam?.colors.text ?? '#e2e2e2',
            }}
          >
            {opponentTeam?.shortName || opponentTeam?.abbreviation || 'N/A'}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs opacity-80 w-full">
            <div>LOCATION</div>
            <div className="text-right">
              {nextMatch ? (nextMatch.homeTeam.id === humanTeam.id ? 'HOME' : 'AWAY') : 'N/A'}
            </div>
            <div>POSITION</div>
            <div className="text-right">{opponentPositionText}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecondPage = () => (
    <div className="h-[31rem] flex flex-col justify-between">
      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-3 text-[17px]">TEAM PERFORMANCE</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>WINS</div>
          <div className="text-right">{humanStanding?.wins ?? 0}</div>
          <div>DRAWS</div>
          <div className="text-right">{humanStanding?.draws ?? 0}</div>
          <div>LOSSES</div>
          <div className="text-right">{humanStanding?.losses ?? 0}</div>
          <div>POINTS</div>
          <div className="text-right">{humanStanding?.points ?? 0}</div>
          <div>GOALS FOR</div>
          <div className="text-right">{humanStanding?.goalsFor ?? 0}</div>
          <div>GOALS AGAINST</div>
          <div className="text-right">{humanStanding?.goalsAgainst ?? 0}</div>
        </div>
      </div>

      <div className="p-3 bg-black/20 border-4 border-white">
        <div className="mb-3 text-[17px]">NEXT OPPONENT</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>TEAM</div>
          <div className="text-right uppercase">
            {opponentTeam?.shortName || opponentTeam?.abbreviation || 'N/A'}
          </div>
          <div>POSITION</div>
          <div className="text-right">{opponentPositionText}</div>
          <div>LOCATION</div>
          <div className="text-right">
            {nextMatch ? (nextMatch.homeTeam.id === humanTeam.id ? 'HOME' : 'AWAY') : 'N/A'}
          </div>
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
          {humanTeam.fullName || 'TEAM NAME'}
        </h2>
      </div>

      {currentPage === 1 ? renderFirstPage() : renderSecondPage()}

      <div className="flex justify-between mt-5">
        <button
          className={`h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 me-2 font-press-start text-[16px] transition-all ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20 active:translate-y-px'
          }`}
          onClick={() => currentPage > 1 && setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        <button
          className="h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 mx-2 font-press-start text-[16px] transition-all hover:bg-white/20 active:translate-y-px"
          onClick={handleBack}
        >
          BACK
        </button>
        <button
          className={`h-[70px] w-1/3 bg-transparent border-4 border-white text-white px-4 py-2 ms-2 font-press-start text-[16px] transition-all ${
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
