import { useState, useEffect, useContext } from 'react';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import TeamPlayers from '../TeamPlayers/TeamPlayers';
import { MatchContext } from '../../contexts/MatchContext';
import teamService from '../../services/teamService';

const MatchSimulator = () => {
  const [time, setTime] = useState(0);
  const { matches, teamSquadView, setMatches, increaseScore, setScorer } =
    useContext(MatchContext);
  const { getTeams } = teamService;

  useEffect(() => {
    setMatches(getTeams(1));
    setMatches(getTeams(2));
  }, []);

  useEffect(() => {
    let timer;

    timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    if (time >= 90 || teamSquadView) {
      clearInterval(timer);
    }

    if (matches) {
      Functions.tickClock(time, setScorer, matches, increaseScore);
    }

    return () => clearInterval(timer);
  }, [time, matches, teamSquadView]);

  return (
    <div className="match-simulator">
      <div className="timebar" style={{ width: `${(time * 100) / 90}%` }}>
        <p className="time">{`${time}'`}</p>
      </div>

      {!teamSquadView ? (
        <div className="scoreboard">
          {matches.map((match, index) => (
            <div className="match" key={index}>
              <TeamComponent team={match.homeTeam} matchId={match.id} />
              <Score
                homeScore={match.homeTeam.score}
                guestScore={match.visitorTeam.score}
              />
              <TeamComponent team={match.visitorTeam} matchId={match.id} />
              <div className="scorer">
                {match?.lastScorer
                  ? `${match.lastScorer.playerName} ${match.lastScorer.time}'`
                  : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {teamSquadView ? <TeamPlayers teamSquadView={teamSquadView} /> : null}
    </div>
  );
};

export default MatchSimulator;
