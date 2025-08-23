import React, { useState, useContext, useEffect } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { MatchContext } from '../../contexts/MatchContext';
import sessionService from '../../services/sessionService';
import generalService from '../../services/generalService';
import { handlePromotionRelegationLogic } from '../../services/promotionRelegationService';
import { TeamStanding, TeamStandingsProps } from './types';

const TeamStandings: React.FC<TeamStandingsProps> = ({ standings: propStandings }) => {
  const { setScreenDisplayed, state: generalState } = useContext(GeneralContext);
  const {
    state: championshipState,
    getTableStandings,
    incrementYear,
    setCurrentRound,
    incrementCurrentRound,
    resetTableStandings,
    updateChampionshipState,
  } = useChampionshipContext();
  const { matches } = useContext(MatchContext);
  const RESULTS_PER_PAGE = 12;
  const [page, setPage] = useState(0);

  // Save session when TeamStandings is displayed (after each round)
  useEffect(() => {
    sessionService.saveSession({
      general: generalState,
      championship: championshipState,
      matches,
    });
  }, [generalState, championshipState, matches]);

  // Use prop standings if provided (for tests), otherwise use real standings from context
  const tableStandings = propStandings
    ? propStandings.map((s) => ({
        teamId: s.teamId,
        teamAbbreviation: s.teamAbbreviation,
        wins: s.wins,
        draws: s.draws,
        losses: s.losses,
        goalDifference: s.goalDifference,
        points: s.points,
      }))
    : getTableStandings();

  const standings: TeamStanding[] =
    tableStandings.length > 0
      ? tableStandings.map((s) => ({
          teamId: s.teamId,
          teamAbbreviation: s.teamAbbreviation,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalDifference: s.goalDifference,
          points: s.points,
        }))
      : Array.from({ length: 16 }, (_, i) => ({
          teamId: `CEA${i}`,
          teamAbbreviation: 'CEA',
          wins: 4,
          draws: 3,
          losses: 1,
          goalDifference: 10,
          points: 10,
        }));

  const totalPages = Math.ceil(standings.length / RESULTS_PER_PAGE);
  const paginatedStandings = standings.slice(
    page * RESULTS_PER_PAGE,
    (page + 1) * RESULTS_PER_PAGE
  );

  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };
  const handleNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const handleContinue = () => {
    if (isSeasonComplete) {
      handlePromotionRelegationLogic(updateChampionshipState, championshipState);
      resetTableStandings();
      incrementYear();
    }

    const totalRounds = championshipState.seasonMatchCalendar.length;
    if (championshipState.currentRound >= totalRounds) {
      setCurrentRound(1);
    } else {
      incrementCurrentRound();
    }

    setScreenDisplayed('TeamManager');
  };

  const handleBack = () => {
    setScreenDisplayed(generalState.previousScreenDisplayed);
  };

  const totalRounds = championshipState.seasonMatchCalendar.length;
  const isSeasonComplete = championshipState.currentRound >= totalRounds;

  // Get championship display name
  let championshipName = championshipState.selectedChampionship;
  if (championshipState.selectedChampionship) {
    const allChamps = generalService.getAllChampionships();
    const foundChamp = allChamps.find(
      (c) => c.internalName === championshipState.selectedChampionship
    );
    if (foundChamp) championshipName = foundChamp.name;
  }

  return (
    <div className="font-press-start min-h-screen" style={{ backgroundColor: '#3d7a33' }}>
      <div className="text-center text-[16px] text-white mt-6 mb-2 tracking-wider uppercase">
        {championshipName}
      </div>
      <div className="text-center text-[14px] text-white mb-2 uppercase">
        {!isSeasonComplete && (
          <>
            {championshipState.year} - Round {championshipState.currentRound} of {totalRounds}
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
        <div className="w-full mt-[14px]" style={{ maxHeight: 587, overflowY: 'auto' }}>
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
                <React.Fragment key={row.teamId}>
                  <tr className="text-[18px] text-white">
                    <td className="w-[56px] text-center py-2">
                      {page * RESULTS_PER_PAGE + idx + 1}
                    </td>
                    <td className="w-[56px] text-center">{row.teamAbbreviation}</td>
                    <td className="w-[56px] text-center">{row.wins}</td>
                    <td className="w-[56px] text-center">{row.draws}</td>
                    <td className="w-[56px] text-center">{row.losses}</td>
                    <td className="w-[56px] text-center pr-0">{row.points}</td>
                  </tr>
                  {idx < paginatedStandings.length - 1 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 0, border: 0 }}>
                        <div
                          style={{
                            height: '4px',
                            background: '#e2e2e2',
                            width: '100%',
                          }}
                        />
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
          style={{
            display: generalState.previousScreenDisplayed !== 'MatchSimulator' ? 'block' : 'none',
          }}
          onClick={handleBack}
        >
          BACK
        </button>
        <button
          className="border-4 border-white w-[180px] h-[56px] flex items-center justify-center text-[18px] text-white bg-transparent hover:bg-white hover:text-[#397a33] transition mx-2 cursor-pointer"
          style={{
            display: generalState.previousScreenDisplayed === 'MatchSimulator' ? 'block' : 'none',
          }}
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
  );
};

export default TeamStandings;
