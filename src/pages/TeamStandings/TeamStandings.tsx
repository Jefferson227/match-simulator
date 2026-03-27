import React, { useMemo, useState } from 'react';
import Standing from '../../../core/models/Standing';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';

const RESULTS_PER_PAGE = 12;

interface TeamStandingsProps {
  standings?: Standing[];
}

const TeamStandings: React.FC<TeamStandingsProps> = ({ standings: propStandings }) => {
  const engine = useGameEngine();
  const state = useGameState(engine);
  const [page, setPage] = useState(0);

  const championship = state.championshipContainer.playableChampionship;

  const standings = useMemo<Standing[]>(() => {
    if (propStandings !== undefined) return propStandings;
    if (!championship?.standings?.length) return [];

    return championship.standings;
  }, [championship, propStandings]);

  const totalPages = Math.max(1, Math.ceil(standings.length / RESULTS_PER_PAGE));
  const paginatedStandings = standings.slice(
    page * RESULTS_PER_PAGE,
    (page + 1) * RESULTS_PER_PAGE
  );

  const totalRounds = championship?.matchContainer?.totalRounds ?? 0;
  const currentRound = championship?.matchContainer?.currentRound ?? 1;
  const completedRound = Math.min(Math.max(currentRound - 1, 1), totalRounds || 1);
  const isSeasonComplete = totalRounds > 0 && currentRound > totalRounds;

  const handlePrevPage = () => {
    if (page > 0) setPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages - 1) setPage((prev) => prev + 1);
  };

  const handleContinue = () => {
    engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamManager' });
  };

  return (
    <MainLayout>
      <div className="font-press-start min-h-screen flex flex-col items-center">
        <div className="text-center text-[16px] text-white mt-6 mb-2 tracking-wider uppercase">
          {championship?.name ?? 'Standings'}
        </div>
        <div className="text-center text-[14px] text-white mb-2 uppercase">
          {!isSeasonComplete && totalRounds > 0 && (
            <>
              {championship?.matchContainer?.currentSeason} - Round {completedRound} of {totalRounds}
            </>
          )}
          {isSeasonComplete && (
            <span className="block text-[12px] text-yellow-300">SEASON COMPLETE!</span>
          )}
        </div>

        <div
          className="w-[350px] h-[610px] mx-auto mt-0 mb-0 flex flex-col items-center"
          style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
        >
          <div className="w-full h-[587px] mt-[14px] overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-[18px] text-white">
                  <th className="font-normal w-[56px] text-center"> </th>
                  <th className="font-normal w-[56px] text-center"> </th>
                  <th className="font-normal w-[56px] text-center">W</th>
                  <th className="font-normal w-[56px] text-center">D</th>
                  <th className="font-normal w-[56px] text-center">L</th>
                  <th className="font-normal w-[56px] text-center pr-3">PTS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStandings.map((row, idx) => (
                  <React.Fragment key={row.team.id}>
                    <tr className="text-[18px] text-white">
                      <td className="w-[56px] text-center py-2">
                        {page * RESULTS_PER_PAGE + idx + 1}
                      </td>
                      <td className="w-[56px] text-center py-2">
                        <div
                          className="inline-flex min-w-[72px] justify-center border-[4px] px-2 py-1"
                          style={{
                            borderColor: row.team.colors.outline,
                            backgroundColor: row.team.colors.background,
                            color: row.team.colors.text,
                          }}
                        >
                          {row.team.abbreviation}
                        </div>
                      </td>
                      <td className="w-[56px] text-center">{row.wins}</td>
                      <td className="w-[56px] text-center">{row.draws}</td>
                      <td className="w-[56px] text-center">{row.losses}</td>
                      <td className="w-[56px] text-center pr-0">{row.points}</td>
                    </tr>
                    {idx < paginatedStandings.length - 1 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, border: 0 }}>
                          <div style={{ height: '4px', background: '#e2e2e2', width: '100%' }} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-between w-[350px] mt-4 mx-auto">
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[18px] bg-transparent transition ${
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
            className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
            onClick={handleContinue}
          >
            {isSeasonComplete ? 'NEW SEASON' : 'CONTINUE'}
          </button>
          <button
            className={`border-4 w-[80px] h-[56px] flex items-center justify-center text-[18px] bg-transparent transition ${
              page >= totalPages - 1 || totalPages <= 1
                ? 'border-[#b0b0b0] text-[#b0b0b0] cursor-not-allowed'
                : 'border-white text-white hover:bg-white hover:text-[#397a33] cursor-pointer'
            }`}
            onClick={handleNextPage}
            disabled={page >= totalPages - 1 || totalPages <= 1}
            aria-label="Next"
          >
            {'>'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamStandings;
