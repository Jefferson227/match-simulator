import { useState, useEffect, useContext, FC } from 'react';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import TeamPlayers from '../TeamPlayers/TeamPlayers';
import { MatchContext } from '../../contexts/MatchContext';
import { GeneralContext } from '../../contexts/GeneralContext';
import teamService from '../../services/teamService';
import MatchDetails from '../MatchDetails';

const MatchSimulator: FC = () => {
  const [time, setTime] = useState<number>(0);
  const [detailsMatchId, setDetailsMatchId] = useState<string | null>(null);
  const { matches, teamSquadView, setMatches, increaseScore, setScorer } =
    useContext(MatchContext);
  const { state } = useContext(GeneralContext);
  const { getTeams } = teamService;

  useEffect(() => {
    // TODO: Set the matches from the generalReducer
    // setMatches(getTeams(1));
    // setMatches(getTeams(2));

    setMatches({
      homeTeam: state.matchOtherTeams[0],
      visitorTeam: state.matchOtherTeams[1],
    });
    setMatches({
      homeTeam: state.matchOtherTeams[2],
      visitorTeam: state.matchOtherTeams[3],
    });
    setMatches({
      homeTeam: state.matchOtherTeams[4],
      visitorTeam: state.matchOtherTeams[5],
    });
  }, []);

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

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [time, matches, teamSquadView, detailsMatchId, setScorer, increaseScore]);

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
              className="w-[320px] flex justify-between items-center mb-[58px] relative"
              key={index}
            >
              <TeamComponent team={match.homeTeam} matchId={match.id} />
              <Score
                homeScore={match.homeTeam.score || 0}
                guestScore={match.visitorTeam.score || 0}
                onClick={() => setDetailsMatchId(match.id)}
              />
              <TeamComponent team={match.visitorTeam} matchId={match.id} />
              <div className="absolute -bottom-8 left-0 text-[14px] text-[#e2e2e2] uppercase">
                {match?.lastScorer
                  ? `${match.lastScorer.playerName} ${match.lastScorer.time}'`
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
