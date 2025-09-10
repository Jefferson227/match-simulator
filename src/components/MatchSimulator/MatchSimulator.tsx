import { useState, useEffect, useContext, FC } from 'react';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import TeamPlayers from '../TeamPlayers/TeamPlayers';
import { MatchContext } from '../../contexts/MatchContext';
import { GeneralContext } from '../../contexts/GeneralContext';
import { useChampionshipContext } from '../../contexts/ChampionshipContext';
import { getCurrentRoundMatches } from '../../services/teamService';
import MatchDetails from '../MatchDetails';
import utils from '../../utils/utils';
import { setUpMatches } from './helpers/matchSimulatorHelper';

const MATCHES_PER_PAGE = 6;

const MatchSimulator: FC = () => {
  const [time, setTime] = useState<number>(0);
  const [detailsMatchId, setDetailsMatchId] = useState<string | null>(null);
  const [standingsUpdated, setStandingsUpdated] = useState(false);
  const [standingsTimeoutSet, setStandingsTimeoutSet] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { matches, teamSquadView, setMatches, increaseScore, setScorer } = useContext(MatchContext);
  const { state, setScreenDisplayed, setIsRoundOver, setClockSpeed } = useContext(GeneralContext);
  const {
    state: championshipState,
    updateTableStandings,
    updateTeamMorale,
  } = useChampionshipContext();

  // Determine if we're using group-based matches
  const usingGroups = championshipState.seasonMatchCalendarGroups.length > 0;
  const currentGroupRounds = usingGroups ? championshipState.seasonMatchCalendarGroups : null;

  // Reset timer and detailsMatchId when leaving MatchSimulator
  useEffect(() => {
    if (state.screenDisplayed !== 'MatchSimulator') {
      setTime(0);
      setDetailsMatchId(null);
      setCurrentPage(0);
    }
  }, [state.screenDisplayed]);

  // Reset standingsUpdated and standingsTimeoutSet when a new round starts (time resets to 0)
  useEffect(() => {
    if (time === 0) {
      setStandingsUpdated(false);
      setStandingsTimeoutSet(false);
      setCurrentPage(0);
      // Removed setClockSpeed(1000) to avoid infinite loop and preserve user preference
    }
  }, [time]);

  // Handle clock speed changes
  const handleClockClick = () => {
    if (state.clockSpeed === 1000) {
      setClockSpeed(500); // 0.5 seconds
    } else if (state.clockSpeed === 500) {
      setClockSpeed(250); // 0.25 seconds
    } else {
      setClockSpeed(1000); // Back to 1 second
    }
  };

  useEffect(() => {
    setUpMatches(championshipState, state, matches, getCurrentRoundMatches, setMatches);
  }, [
    championshipState.seasonMatchCalendar,
    championshipState.seasonMatchCalendarGroups,
    championshipState.currentRound,
    championshipState.humanPlayerBaseTeam,
    state.matchTeam,
    usingGroups,
  ]);

  useEffect(() => {
    let timer: number | undefined;

    if (!detailsMatchId && !teamSquadView && time < 90) {
      timer = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, state.clockSpeed);
    }

    if (matches.length > 0 && time < 90) {
      Functions.tickClock(time, matches, setScorer, increaseScore);
    }

    if (time >= 90 || teamSquadView || detailsMatchId) {
      if (timer) clearInterval(timer);
    }

    // After match ends, update standings and show standings after 5 seconds
    if (
      time >= 90 &&
      !teamSquadView &&
      !detailsMatchId &&
      !standingsUpdated &&
      !standingsTimeoutSet
    ) {
      updateTableStandings(matches);
      setStandingsUpdated(true);
      setStandingsTimeoutSet(true);
      window.setTimeout(() => {
        updateTeamMorale(matches);
        setIsRoundOver(true);
        setScreenDisplayed('TeamStandings');
      }, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [
    time,
    matches,
    teamSquadView,
    detailsMatchId,
    setScorer,
    increaseScore,
    setScreenDisplayed,
    updateTableStandings,
    standingsUpdated,
    standingsTimeoutSet,
    state.clockSpeed,
  ]);

  // Group-based pagination logic
  const getDisplayInfo = () => {
    if (!usingGroups) {
      // Regular pagination by number of matches
      const totalPages = Math.ceil(matches.length / MATCHES_PER_PAGE);
      const startIndex = currentPage * MATCHES_PER_PAGE;
      const selectedMatches = matches.slice(startIndex, startIndex + MATCHES_PER_PAGE);
      return {
        matches: selectedMatches,
        totalPages,
        currentGroupName: null
      };
    }

    // Group-based pagination - each page shows matches from one group
    if (championshipState.seasonMatchCalendarGroups.length === 0) {
      return { matches: [], totalPages: 0, currentGroupName: null };
    }

    const currentGroupIndex = Math.min(currentPage, championshipState.seasonMatchCalendarGroups.length - 1);
    const currentGroup = championshipState.seasonMatchCalendarGroups[currentGroupIndex];
    
    // Filter existing matches to show only those from the current group
    // We'll identify group matches by comparing team IDs since matches were already processed
    const groupTeamIds = new Set(currentGroup.group.tableStandings.map(standing => standing.teamId));
    const groupMatches = matches.filter(match => 
      groupTeamIds.has(match.homeTeam.id) || groupTeamIds.has(match.visitorTeam.id)
    );

    return {
      matches: groupMatches,
      totalPages: championshipState.seasonMatchCalendarGroups.length,
      currentGroupName: currentGroup.group.groupName
    };
  };

  const { matches: selectedMatches, totalPages, currentGroupName } = getDisplayInfo();

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="font-press-start relative min-h-screen">
      <div
        className="h-[33px] bg-[#fbff21] mb-[18px] cursor-pointer transition-all duration-200 hover:bg-[#e6e600]"
        style={{ width: `${(time * 100) / 90}%` }}
        onClick={handleClockClick}
        title={`Clock Speed: ${
          state.clockSpeed === 1000 ? '1x' : state.clockSpeed === 500 ? '2x' : '4x'
        }`}
      >
        <p className="m-0 pt-1 text-right pr-2 text-[20px] text-[#1e1e1e]">{`${time}'`}</p>
      </div>
      <div className="mb-[18px] text-center text-white text-sm uppercase">
        {championshipState.currentRound && !teamSquadView && (
          <div>
            <span>
              {usingGroups ? (
                `${championshipState.year} - Round ${championshipState.currentRound}`
              ) : (
                `${championshipState.year} - Round ${championshipState.currentRound} of ${championshipState.seasonMatchCalendar.length}`
              )}
            </span>
            {usingGroups && currentGroupName && (
              <div className="mt-1 text-xs">
                {currentGroupName}
              </div>
            )}
          </div>
        )}
      </div>

      {!teamSquadView && !detailsMatchId ? (
        <div className="flex flex-col items-center">
          <div className="h-[579px]">
            {selectedMatches.map((match, index) => (
              <div
                className="w-[320px] flex justify-between items-center mb-[48px] relative"
                key={index}
              >
                <TeamComponent team={match.homeTeam} matchId={match.id} />
                <Score
                  homeScore={match.homeTeam.score || 0}
                  guestScore={match.visitorTeam.score || 0}
                  onClick={() => setDetailsMatchId(match.id)}
                />
                <TeamComponent team={match.visitorTeam} matchId={match.id} />
                <div className="absolute -bottom-7 left-0 text-[14px] text-[#e2e2e2] uppercase">
                  {match?.lastScorer
                    ? `${utils.shortenPlayerName(match.lastScorer.playerName)} ${
                        match.lastScorer.time
                      }'`
                    : null}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && !teamSquadView && !detailsMatchId && (
            <div className="w-[320px] flex justify-between items-center mb-[48px] relative">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={usingGroups ? "Previous Group" : "Previous Page"}
              >
                &lt;
              </button>
              <div className="flex flex-col items-center text-white text-xs">
                <span>{usingGroups ? "Group" : "Page"}</span>
                <span>{currentPage + 1} of {totalPages}</span>
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1}
                className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title={usingGroups ? "Next Group" : "Next Page"}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      ) : null}

      {detailsMatchId &&
        (() => {
          const match = matches.find((m) => m.id === detailsMatchId);
          if (!match) return null;
          return (
            <MatchDetails
              match={match}
              scorers={match.scorers || []}
              onBack={() => setDetailsMatchId(null)}
            />
          );
        })()}

      {teamSquadView ? <TeamPlayers teamSquadView={teamSquadView} /> : null}
    </div>
  );
};

export default MatchSimulator;
