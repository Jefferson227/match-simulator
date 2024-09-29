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
  const [teamPlayersView, setTeamPlayersView] = useState(null);
  const { matches, setMatches, increaseScore, setScorer } =
    useContext(MatchContext);
  const { getTeams } = teamService;

  useEffect(() => {
    setMatches(getTeams());
  }, []);

  // Just checking the teams in the console
  // useEffect(() => {
  //   console.log(matches);
  // }, [matches]);

  useEffect(() => {
    let timer;

    timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    if (time >= 90 || teamPlayersView !== null) {
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
  }, [time, matches, teamPlayersView]);

  return (
    <div className="match-simulator">
      <div
        className="timebar"
        style={{ width: `${(time * 100) / 90}%` }}
      >
        <p className="time">{`${time}'`}</p>
      </div>

      {teamPlayersView === null &&
      homeTeam.current &&
      visitorTeam.current ? (
        <div className="scoreboard">
          <TeamComponent
            name={homeTeam.current.abbreviation}
            outlineColor={homeTeam.current.colors.outline}
            backgroundColor={homeTeam.current.colors.background}
            teamNameColor={homeTeam.current.colors.name}
            setTeamPlayersView={() =>
              setTeamPlayersView(homeTeam.current)
            }
          />
          <Score
            homeScore={matches[0].homeTeam.score}
            guestScore={matches[0].visitorTeam.score}
          />
          <TeamComponent
            name={visitorTeam.current.abbreviation}
            outlineColor={visitorTeam.current.colors.outline}
            backgroundColor={visitorTeam.current.colors.background}
            teamNameColor={visitorTeam.current.colors.name}
            setTeamPlayersView={() =>
              setTeamPlayersView(visitorTeam.current)
            }
          />
          <div className="scorer">
            {matches[0]?.lastScorer
              ? `${matches[0].lastScorer.playerName} ${matches[0].lastScorer.time}'`
              : null}
          </div>
        </div>
      ) : null}

      {teamPlayersView !== null ? (
        <TeamPlayers
          team={teamPlayersView}
          resetTeamPlayersView={() => setTeamPlayersView(null)}
        />
      ) : null}
    </div>
  );
};

export default MatchSimulator;
