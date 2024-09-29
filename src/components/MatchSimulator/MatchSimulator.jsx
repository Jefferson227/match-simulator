import { useState, useEffect, useContext, useRef } from 'react';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import TeamPlayers from '../TeamPlayers/TeamPlayers';
import { MatchContext } from '../../contexts/MatchContext';
import teamService from '../../services/teamService';

const MatchSimulator = () => {
  const homeTeam = useRef(null);
  const visitorTeam = useRef(null);
  const [time, setTime] = useState(0);
  const {
    matches,
    teamSquadView,
    setMatches,
    increaseScore,
    setScorer,
  } = useContext(MatchContext);
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

    // Load teams from state
    homeTeam.current = matches[0]?.homeTeam;
    visitorTeam.current = matches[0]?.visitorTeam;

    if (matches[0]) {
      Functions.tickClock(
        time,
        homeTeam.current,
        visitorTeam.current,
        setScorer,
        matches[0].id,
        increaseScore
      );
    }

    return () => clearInterval(timer);
  }, [time, matches, teamSquadView]);

  return (
    <div className="match-simulator">
      <div
        className="timebar"
        style={{ width: `${(time * 100) / 90}%` }}
      >
        <p className="time">{`${time}'`}</p>
      </div>

      {!teamSquadView && homeTeam.current && visitorTeam.current ? (
        <div className="scoreboard">
          <div className="match">
            <TeamComponent team={homeTeam.current} />
            <Score
              homeScore={matches[0].homeTeam.score}
              guestScore={matches[0].visitorTeam.score}
            />
            <TeamComponent team={visitorTeam.current} />
            <div className="scorer">
              {matches[0]?.lastScorer
                ? `${matches[0].lastScorer.playerName} ${matches[0].lastScorer.time}'`
                : null}
            </div>
          </div>
          <div className="match">
            <TeamComponent team={homeTeam.current} />
            <Score
              homeScore={matches[0].homeTeam.score}
              guestScore={matches[0].visitorTeam.score}
            />
            <TeamComponent team={visitorTeam.current} />
            <div className="scorer">
              {matches[0]?.lastScorer
                ? `${matches[0].lastScorer.playerName} ${matches[0].lastScorer.time}'`
                : null}
            </div>
          </div>
        </div>
      ) : null}

      {teamSquadView ? <TeamPlayers team={teamSquadView} /> : null}
    </div>
  );
};

export default MatchSimulator;
