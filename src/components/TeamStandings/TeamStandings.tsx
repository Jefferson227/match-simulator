import React, { useState, useContext, useEffect } from 'react';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { MatchContext } from '../../contexts/MatchContext';
import sessionService from '../../services/sessionService';
import generalService from '../../services/generalService';
import {
  generateSeasonMatchCalendar,
  loadAllTeamsExceptOne,
} from '../../services/teamService';
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

const TeamStandings: React.FC<TeamStandingsProps> = ({
  standings: propStandings,
}) => {
  const { setScreenDisplayed, state: generalState } =
    useContext(GeneralContext);
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

      if (
        currentChamp &&
        currentChamp.promotionTeams &&
        currentChamp.promotionChampionship
      ) {
        // Get human player's team from general context
        const humanPlayerTeam = championshipState.humanPlayerBaseTeam;

        // Check if human player's team is in the top promotion positions
        const humanPlayerTeamInStandings = standings.find(
          (standing) => standing.team === humanPlayerTeam?.abbreviation
        );

        if (humanPlayerTeamInStandings) {
          // Find the position of human player's team in standings
          const humanPlayerPosition =
            standings.findIndex(
              (standing) => standing.team === humanPlayerTeam?.abbreviation
            ) + 1; // +1 because array index is 0-based but position is 1-based

          // Implement promotion logic including human player's team
          if (humanPlayerPosition <= currentChamp.promotionTeams) {
            // Load all teams from the promotion championship from the context
            const promotionChampionship =
              championshipState.otherChampionships.find(
                (champ) =>
                  champ.internalName === currentChamp.promotionChampionship
              );

            // Get the teams from the promotion championship without the relegated teams
            const promotionChampionshipTeams =
              promotionChampionship?.teamsControlledAutomatically;

            // TODO: Implement a proper logic to remove the relegated teams from the promotion championship
            const promotionChampionshipWithoutRelegatedTeams =
              promotionChampionshipTeams?.slice(
                0,
                promotionChampionshipTeams?.length -
                  (currentChamp?.promotionTeams ?? 0)
              );

            // Get the abbreviations of the promoted teams from the current championship
            const promotedTeamsAbbreviations = standings
              .slice(0, currentChamp?.promotionTeams ?? 0)
              .map((t) => t.team);

            // Get the promoted teams from the current championship
            const promotedTeamsFromCurrentChampionship =
              championshipState.teamsControlledAutomatically.filter((t) =>
                promotedTeamsAbbreviations.includes(t.abbreviation)
              );

            // Get the teams to be controlled automatically for the next season
            const teamsToBeControlledAutomatically = [
              ...(promotionChampionshipWithoutRelegatedTeams ?? []),
              ...promotedTeamsFromCurrentChampionship,
            ];

            // Update the context state with the teams to be controlled automatically for the next season
            setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

            // Generate and set the season match calendar for the next season
            const seasonCalendar = generateSeasonMatchCalendar(
              humanPlayerTeam as BaseTeam,
              teamsToBeControlledAutomatically
            );
            setSeasonMatchCalendar(seasonCalendar);

            // Get the relegated teams from the promotion championship
            const relegatedTeamsFromPromotionChampionship =
              promotionChampionshipTeams?.slice(
                -(promotionChampionship?.relegationTeams ?? 0)
              ) ?? [];

            // Get the relegated teams abbreviations from the current championship
            const relegatedTeamsAbbreviations = standings
              .slice(-(currentChamp?.relegationTeams ?? 0))
              .map((t) => t.team);

            // Get the remaining teams from the current championship, not considering the relegated teams and the promoted teams
            const remainingTeamsFromCurrentChampionship =
              championshipState.teamsControlledAutomatically.filter(
                (t) =>
                  !relegatedTeamsAbbreviations.includes(t.abbreviation) &&
                  !promotedTeamsAbbreviations.includes(t.abbreviation)
              );

            // Get the relegation championship
            const relegationChampionship =
              championshipState.otherChampionships.find(
                (c) => c.internalName === currentChamp.relegationChampionship
              );

            // Get the teams from the relegation championship
            const relegationChampionshipTeams =
              relegationChampionship?.teamsControlledAutomatically;

            // Get the promoted teams from the relegation championship
            const promotedTeamsFromRelegationChampionship =
              relegationChampionshipTeams?.slice(
                0,
                relegationChampionship?.promotionTeams ?? 0
              ) ?? [];

            // Gather the teams to be controlled automatically for the next season into a single array
            const adjustedTeamsToBeControlledAutomatically = [
              ...remainingTeamsFromCurrentChampionship,
              ...relegatedTeamsFromPromotionChampionship,
              ...promotedTeamsFromRelegationChampionship,
            ];

            // Create a new ChampionshipConfig object, as the current championship will be included in the otherChampionships array in the context
            const newChampionshipConfig = {
              ...currentChamp,
              teamsControlledAutomatically:
                adjustedTeamsToBeControlledAutomatically,
            };

            // Get the relegated teams from the current championship
            const relegatedTeamsFromCurrentChampionship =
              championshipState.teamsControlledAutomatically.filter((t) =>
                relegatedTeamsAbbreviations.includes(t.abbreviation)
              );

            // Get the remaining teams from the relegation championship, not including the promoted teams
            const remainingTeamsFromRelegationChampionship =
              relegationChampionshipTeams
                ?.filter(
                  (t) =>
                    !promotedTeamsFromRelegationChampionship
                      .map((promotedTeam) => promotedTeam.id)
                      .includes(t.id)
                )
                .slice(-(relegationChampionship?.promotionTeams ?? 0)) ?? [];

            // Gather the teams to be controlled automatically to be set to the relegation championship
            const teamsToBeControlledAutomaticallyForRelegationChampionship = [
              ...remainingTeamsFromRelegationChampionship,
              ...relegatedTeamsFromCurrentChampionship,
            ];

            // Create a new ChampionshipConfig object for the relegation championship
            const newRelegationChampionshipConfig = {
              ...relegationChampionship!,
              teamsControlledAutomatically:
                teamsToBeControlledAutomaticallyForRelegationChampionship,
            };

            // Add the new ChampionshipConfig object in the context (championshipState.otherChampionships)
            addOrUpdateOtherChampionship(newChampionshipConfig);

            // Add the new ChampionshipConfig object for the relegation championship in the context (championshipState.otherChampionships)
            addOrUpdateOtherChampionship(newRelegationChampionshipConfig);

            // Set the promotion championship as the current championship
            setChampionship(currentChamp.promotionChampionship);
          } else if (
            humanPlayerPosition >=
            (currentChamp.numberOfTeams ?? 20) -
              (currentChamp.relegationTeams ?? 4)
          ) {
            // TODO: Implement the logic to handle the case where the human player's team was relegated
          } else {
            // The human player's team wasn't promoted
            // Load all teams from the promotion championship
            loadAllTeamsExceptOne(
              currentChamp.promotionChampionship,
              '',
              humanPlayerTeam?.abbreviation
            ).then((allTeamsFromPromotionChampionship) => {
              // TODO: Implement a proper logic to get the relegated teams from the promotion championship
              const relegatedTeamsFromPromotionChampionship =
                allTeamsFromPromotionChampionship.slice(
                  -(currentChamp?.promotionTeams ?? 0)
                );

              // Get the relegated teams abbreviations from the current championship
              const relegatedTeamsAbbreviations = standings
                .slice(-(currentChamp?.promotionTeams ?? 0))
                .map((t) => t.team);

              // If the human player's team is in the relegated teams, show the game over screen
              if (
                relegatedTeamsAbbreviations.includes(
                  humanPlayerTeam?.abbreviation ?? ''
                )
              ) {
                console.error(
                  "Game over! Your team was relegated to a championship that doesn't exist"
                );
                return;
              }

              // Get the remaining teams from the current championship, not considering the relegated teams
              const remainingTeamsFromCurrentChampionship =
                championshipState.teamsControlledAutomatically.filter(
                  (t) => !relegatedTeamsAbbreviations.includes(t.abbreviation)
                );

              const teamsToBeControlledAutomatically = [
                ...remainingTeamsFromCurrentChampionship,
                ...relegatedTeamsFromPromotionChampionship,
              ];

              setTeamsControlledAutomatically(teamsToBeControlledAutomatically);

              // Generate and set the season match calendar
              const seasonCalendar = generateSeasonMatchCalendar(
                humanPlayerTeam as BaseTeam,
                teamsToBeControlledAutomatically
              );
              setSeasonMatchCalendar(seasonCalendar);
            });
          }
        }
      }

      resetTableStandings();
      incrementYear();
    }

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
    <div
      className="font-press-start min-h-screen"
      style={{ backgroundColor: '#3d7a33' }}
    >
      <div className="text-center text-[16px] text-white mt-6 mb-2 tracking-wider uppercase">
        {championshipName}
      </div>
      <div className="text-center text-[14px] text-white mb-2 uppercase">
        {!isSeasonComplete && (
          <>
            {championshipState.year} - Round {championshipState.currentRound} of{' '}
            {totalRounds}
          </>
        )}
        {isSeasonComplete && (
          <span className="block text-[12px] text-yellow-300">
            SEASON COMPLETE!
          </span>
        )}
      </div>
      <div
        className="w-[350px] h-[610px] mx-auto mt-0 mb-0 flex flex-col items-center"
        style={{ backgroundColor: '#397a33', border: '4px solid #e2e2e2' }}
      >
        <div
          className="w-full mt-[14px]"
          style={{ maxHeight: 587, overflowY: 'auto' }}
        >
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
