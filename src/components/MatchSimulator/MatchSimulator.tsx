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

const MatchSimulator: FC = () => {
  const [time, setTime] = useState<number>(0);
  const [detailsMatchId, setDetailsMatchId] = useState<string | null>(null);
  const { matches, teamSquadView, setMatches, increaseScore, setScorer } =
    useContext(MatchContext);
  const { state, setMatchOtherTeams, setScreenDisplayed } =
    useContext(GeneralContext);
  const { state: championshipState } = useChampionshipContext();

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
        championshipState.humanPlayerBaseTeam
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
  ]);

  useEffect(() => {
    let timer: number | undefined;
    let standingsTimeout: number | undefined;

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

    // After match ends, show standings after 5 seconds
    if (time >= 90 && !teamSquadView && !detailsMatchId) {
      standingsTimeout = window.setTimeout(() => {
        setScreenDisplayed('TeamStandings');
      }, 5000);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (standingsTimeout) clearTimeout(standingsTimeout);
    };
  }, [
    time,
    matches,
    teamSquadView,
    detailsMatchId,
    setScorer,
    increaseScore,
    setScreenDisplayed,
  ]);

  return (
    <div className="font-press-start">
      <div
        className="h-[33px] bg-[#fbff21] mb-[33px]"
        style={{ width: `${(time * 100) / 90}%` }}
      >
        <p className="m-0 pt-1 text-right pr-2 text-[20px] text-[#1e1e1e]">{`${time}'`}</p>
      </div>

      {!teamSquadView && !detailsMatchId ? (
        <div className="flex flex-col items-center">
          {matches.map((match, index) => (
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
