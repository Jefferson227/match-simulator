import React, { useState, useContext, useEffect } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { MatchContext } from '../../contexts/MatchContext';
import sessionService from '../../services/sessionService';
import generalService from '../../services/generalService';
import {
  handlePromotionLogic,
  handleRelegationLogic,
  handleNoPromotionAndNoRelegationLogic,
} from '../../services/promotionRelegationService';
import { BaseTeam } from '../../types';

interface TeamStanding {
  team: string;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
}

interface TeamStandingsProps {
  standings?: TeamStanding[];
}

const TeamStandings: React.FC<TeamStandingsProps> = ({ standings: propStandings }) => {
  const { setScreenDisplayed, state: generalState } = useContext(GeneralContext);
  const {
    state: championshipState,
    getTableStandings,
    setChampionship,
    setTeamsControlledAutomatically,
    setSeasonMatchCalendar,
    incrementYear,
    setCurrentRound,
    incrementCurrentRound,
    resetTableStandings,
    addOrUpdateOtherChampionship,
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
        teamAbbreviation: s.team,
        wins: s.w,
        draws: s.d,
        losses: s.l,
        goalDifference: s.gd,
        points: s.pts,
      }))
    : getTableStandings();

  const standings: TeamStanding[] =
    tableStandings.length > 0
      ? tableStandings.map((s) => ({
          team: s.teamAbbreviation,
          w: s.wins,
          d: s.draws,
          l: s.losses,
          gd: s.goalDifference,
          pts: s.points,
        }))
      : Array.from({ length: 16 }, (_, i) => ({
          team: 'CEA',
          w: 4,
          d: 3,
          l: 1,
          gd: 10,
          pts: 10,
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
    // Only handle promotion logic if season is complete
    if (isSeasonComplete) {
      // Get current championship configuration
      const allChamps = generalService.getAllChampionships();
      const currentChamp = allChamps.find(
        (c) => c.internalName === championshipState.selectedChampionship
      );

      if (currentChamp && currentChamp.promotionTeams && currentChamp.promotionChampionship) {
        // Get human player's team from general context
        const humanPlayerTeam = championshipState.humanPlayerBaseTeam;

        // Check if human player's team is in the top promotion positions
        const humanPlayerTeamInStandings = standings.find(
          (standing) => standing.team === humanPlayerTeam?.abbreviation
        );

        if (humanPlayerTeamInStandings) {
          // Find the position of human player's team in standings
          const humanPlayerPosition =
            standings.findIndex((standing) => standing.team === humanPlayerTeam?.abbreviation) + 1; // +1 because array index is 0-based but position is 1-based

          // Run promotion logic considering human player's team is among the promoted teams
          if (humanPlayerPosition <= currentChamp.promotionTeams) {
            handlePromotionLogic(
              {
                setTeamsControlledAutomatically,
                setSeasonMatchCalendar,
                setChampionship,
                addOrUpdateOtherChampionship,
              },
              currentChamp,
              championshipState,
              standings,
              humanPlayerTeam as BaseTeam
            );
          } else if (
            humanPlayerPosition >=
            (currentChamp.numberOfTeams ?? 20) - (currentChamp.relegationTeams ?? 4)
          ) {
            // Run promotion logic considering human player's team is among the relegated teams
            handleRelegationLogic(
              {
                setTeamsControlledAutomatically,
                setSeasonMatchCalendar,
                setChampionship,
                addOrUpdateOtherChampionship,
              },
              currentChamp,
              championshipState,
              standings,
              humanPlayerTeam as BaseTeam
            );
          } else {
            // Run promotion logic considering human player's team is neither among the promoted teams nor among the relegated teams
            handleNoPromotionAndNoRelegationLogic(
              {
                setTeamsControlledAutomatically,
                setSeasonMatchCalendar,
                setChampionship,
                addOrUpdateOtherChampionship,
              },
              currentChamp,
              championshipState,
              standings,
              humanPlayerTeam as BaseTeam
            );
          }
        }
      }

      resetTableStandings();
      incrementYear();
    }

    /*
    TODO: Apply logic to update team morale
    - The logic applies to all teams in the current championship only
    - Morale increase/decrease logic:
      - If the team wins a match, morale gets increased by 10
      - If the team loses a match, morale gets decreased by 10
      - If the team draws a match, morale gets increased by 5
      - The team's morale can't go below 0 or above 100

    - Players' strength increase/decrease logic:
      - If the team's morale is less or equal to 35, a random number of players between 1 and 5 get their strength decreased by 1
      - If the team's morale is above 35 and less or equal to 65, no player's strength changes
      - If the team's morale is above 65, a random number of players between 1 and 5 get their strength increased by 1
    */

    // Check if we've completed all rounds
    const totalRounds = championshipState.seasonMatchCalendar.length;
    if (championshipState.currentRound >= totalRounds) {
      setCurrentRound(1);
    } else {
      incrementCurrentRound();
    }

    setScreenDisplayed('TeamManager');
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
                <React.Fragment key={idx}>
                  <tr className="text-[18px] text-white">
                    <td className="w-[56px] text-center py-2">
                      {page * RESULTS_PER_PAGE + idx + 1}
                    </td>
                    <td className="w-[56px] text-center">{row.team}</td>
                    <td className="w-[56px] text-center">{row.w}</td>
                    <td className="w-[56px] text-center">{row.d}</td>
                    <td className="w-[56px] text-center">{row.l}</td>
                    <td className="w-[56px] text-center pr-0">{row.pts}</td>
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
