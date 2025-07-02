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

const MATCHES_PER_PAGE = 6;

const MatchSimulator: FC = () => {
  const [time, setTime] = useState<number>(0);
  const [detailsMatchId, setDetailsMatchId] = useState<string | null>(null);
  const [standingsUpdated, setStandingsUpdated] = useState(false);
  const [standingsTimeoutSet, setStandingsTimeoutSet] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { matches, teamSquadView, setMatches, increaseScore, setScorer } =
    useContext(MatchContext);
  const { state, setMatchOtherTeams, setScreenDisplayed } =
    useContext(GeneralContext);
  const { state: championshipState, updateTableStandings } =
    useChampionshipContext();

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
    }
  }, [time]);

  useEffect(() => {
    // Only set matches if not already set for this round
    if (
      championshipState.seasonMatchCalendar.length > 0 &&
      championshipState.humanPlayerBaseTeam &&
      (matches.length === 0 ||
        matches[0]?.round !== championshipState.currentRound)
    ) {
      const currentRoundMatches = getCurrentRoundMatches(
        championshipState.seasonMatchCalendar,
        championshipState.currentRound,
        championshipState.humanPlayerBaseTeam,
        state.matchTeam || undefined
      );

      // Transform to the format expected by MatchSimulator
      const transformedMatches = currentRoundMatches.map((match) => ({
        id: crypto.randomUUID(),
        homeTeam: match.homeTeam,
        visitorTeam: match.visitorTeam,
        lastScorer: null,
        ballPossession: {
          isHomeTeam: true,
          position: 'midfield' as const,
        },
        shotAttempts: 0,
        scorers: [],
        round: championshipState.currentRound, // Add round info
      }));

      setMatches(transformedMatches);
    }
    // eslint-disable-next-line
  }, [
    championshipState.seasonMatchCalendar,
    championshipState.currentRound,
    championshipState.humanPlayerBaseTeam,
    state.matchTeam,
  ]);

  useEffect(() => {
    let timer: number | undefined;

    if (!detailsMatchId && !teamSquadView && time < 90) {
      timer = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
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
  ]);

  const totalPages = Math.ceil(matches.length / MATCHES_PER_PAGE);

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

  const startIndex = currentPage * MATCHES_PER_PAGE;
  const selectedMatches = matches.slice(
    startIndex,
    startIndex + MATCHES_PER_PAGE
  );

  return (
    <div className="font-press-start relative min-h-screen">
      <div
        className="h-[33px] bg-[#fbff21] mb-[18px]"
        style={{ width: `${(time * 100) / 90}%` }}
      >
        <p className="m-0 pt-1 text-right pr-2 text-[20px] text-[#1e1e1e]">{`${time}'`}</p>
      </div>
      <div className="mb-[18px] text-center text-white text-sm uppercase">
        {championshipState.currentRound &&
          championshipState.seasonMatchCalendar.length > 0 &&
          !teamSquadView && (
            <span>
              {`Round ${championshipState.currentRound} of ${championshipState.seasonMatchCalendar.length}`}
            </span>
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
                    ? `${utils.shortenPlayerName(
                        match.lastScorer.playerName
                      )} ${match.lastScorer.time}'`
                    : null}
                </div>
              </div>
            ))}
          </div>

          {matches.length > MATCHES_PER_PAGE &&
            !teamSquadView &&
            !detailsMatchId && (
              <div className="w-[320px] flex justify-between items-center mb-[48px] relative">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="border-4 border-white w-20 h-20 flex items-center justify-center text-lg transition hover:bg-white hover:text-[#3d7a33] text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
