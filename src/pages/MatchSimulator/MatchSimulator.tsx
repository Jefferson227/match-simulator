import { useState, useEffect, FC } from 'react';
import Score from '../../components/Score';
import TeamComponent from '../../components/TeamComponent';
import TeamPlayers from '../../components/TeamPlayers/TeamPlayers';
import MatchDetails from '../../components/MatchDetails';
import utils from '../../utils/utils';
import MainLayout from '../../components/MainLayout/MainLayout';
import { useGameEngine } from '../../contexts/GameEngineContext';
import { useGameState } from '../../services/useGameState';
import Clock from '../../components/Clock';
import Match from '../../../core/models/Match';
import { getMatchesForCurrentRound } from '../../../use-cases/ChampionshipUseCases';

const MATCHES_PER_PAGE = 6;

const MatchSimulator: FC = () => {
  // Game engine
  const engine = useGameEngine();
  const state = useGameState(engine);

  const [time, setTime] = useState<number>(0);
  const [clockSpeed, setClockSpeed] = useState<number>(0);
  const [detailsMatchId, setDetailsMatchId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    // TODO: clockSpeed is retrieved in the beginning, and it needs to be reassigned to the state after the match ends
    setClockSpeed(state.gameConfig.clockSpeed);

    const matchesResult = getMatchesForCurrentRound(
      state.championshipContainer.playableChampionship
    );

    if (!matchesResult.succeeded)
      engine.dispatch({ type: 'SET_ERROR_MESSAGE', errorMessage: matchesResult.error.message });

    setMatches(matchesResult.getResult());
  }, []);

  // Reset timer and detailsMatchId when leaving MatchSimulator
  useEffect(() => {
    if (state.currentScreen !== 'MatchSimulator') {
      setTime(0);
      setDetailsMatchId(null);
      setCurrentPage(0);
    }
  }, [state.currentScreen]);

  // Handle clock speed changes
  const handleClockClick = () => {
    if (state.gameConfig.clockSpeed === 1000) {
      setClockSpeed(500); // 0.5 seconds
    } else if (state.gameConfig.clockSpeed === 500) {
      setClockSpeed(250); // 0.25 seconds
    } else {
      setClockSpeed(1000); // Back to 1 second
    }
  };

  // useEffect responsible for ticking the clock and calling the actions to run the matches
  useEffect(() => {
    let timer: number | undefined;

    // If no other in-match screen is visible, the clock timer is increased by 1
    if (!detailsMatchId && !teamSquadView && time < 90) {
      timer = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, state.gameConfig.clockSpeed);
    }

    // Represents one clock tick
    if (matches.length > 0 && time < 90) {
      // engine.dispatch({ type: 'RUN_MATCH_ACTIONS' });
    }

    // When the matches ends, stop the clock
    if (time >= 90 || teamSquadView || detailsMatchId) {
      if (timer) clearInterval(timer);
    }

    // After match ends, run the actions necessary to update the standings
    if (time >= 90 && !teamSquadView && !detailsMatchId) {
      window.setTimeout(() => {
        // engine.dispatch({ type: 'END_MATCHES' });
        // engine.dispatch({ type: 'SET_CURRENT_SCREEN', screenName: 'TeamStandings' });
      }, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [time, detailsMatchId, state.gameConfig.clockSpeed]);

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
  const selectedMatches = matches.slice(startIndex, startIndex + MATCHES_PER_PAGE);

  return (
    <MainLayout>
      <div className="font-press-start relative min-h-screen">
        <Clock time={time} handleClockClick={handleClockClick} clockSpeed={clockSpeed} />
        <div className="mb-[18px] text-center text-white text-sm uppercase">
          {state.championshipContainer.playableChampionship.matchContainer.currentRound &&
            matches.length > 0 &&
            !teamSquadView && (
              <span>
                {`${state.championshipContainer.playableChampionship.matchContainer.currentSeason} - Round ${state.championshipContainer.playableChampionship.matchContainer.currentRound} of ${state.championshipContainer.playableChampionship.matchContainer.totalRounds}`}
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
                    homeScore={match.homeTeamScore}
                    guestScore={match.awayTeamScore}
                    onClick={() => setDetailsMatchId(match.id)}
                  />
                  <TeamComponent team={match.awayTeam} matchId={match.id} />
                  <div className="absolute -bottom-7 left-0 text-[14px] text-[#e2e2e2] uppercase">
                    {match.scorers.length > 0
                      ? `${utils.shortenPlayerName(match.scorers[match.scorers.length - 1].player.name)} ${
                          match.scorers[match.scorers.length - 1].time
                        }'`
                      : null}
                  </div>
                </div>
              ))}
            </div>

            {matches.length > MATCHES_PER_PAGE && !teamSquadView && !detailsMatchId && (
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
    </MainLayout>
  );
};

export default MatchSimulator;
