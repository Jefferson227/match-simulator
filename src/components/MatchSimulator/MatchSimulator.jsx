import { useState, useEffect, useMemo, useContext } from 'react';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import TeamPlayers from '../TeamPlayers/TeamPlayers';
import { MatchContext } from '../../contexts/MatchContext';
import teamService from '../../services/teamService';

const MatchSimulator = () => {
  const homeTeam = useMemo(() => Functions.loadHomeTeam(), []);
  const visitorTeam = useMemo(() => Functions.loadVisitorTeam(), []);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [visitorTeamScore, setVisitorTeamScore] = useState(0);
  const [scorer, setScorer] = useState(null);
  const [time, setTime] = useState(0);
  const [teamPlayersView, setTeamPlayersView] = useState(null);
  const { setMatches, matches } = useContext(MatchContext);

  useEffect(() => {
    setMatches(teamService.getTeams());
  }, []);

  useEffect(() => {
    console.log(matches);
  }, [matches]);

  useEffect(() => {
    let timer;

    timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    if (time >= 90 || teamPlayersView !== null) {
      clearInterval(timer);
    }

    Functions.tickClock(
      time,
      homeTeam,
      visitorTeam,
      setHomeTeamScore,
      setVisitorTeamScore,
      setScorer
    );

    return () => clearInterval(timer);
  }, [time, homeTeam, visitorTeam, teamPlayersView]);

  return (
    <div className="match-simulator">
      <div
        className="timebar"
        style={{ width: `${(time * 100) / 90}%` }}
      >
        <p className="time">{`${time}'`}</p>
      </div>

      {teamPlayersView === null ? (
        <div className="scoreboard">
          <TeamComponent
            name={homeTeam.abbreviation}
            outlineColor={homeTeam.colors.outline}
            backgroundColor={homeTeam.colors.background}
            teamNameColor={homeTeam.colors.name}
            setTeamPlayersView={() => setTeamPlayersView(homeTeam)}
          />
          <Score
            homeScore={homeTeamScore}
            guestScore={visitorTeamScore}
          />
          <TeamComponent
            name={visitorTeam.abbreviation}
            outlineColor={visitorTeam.colors.outline}
            backgroundColor={visitorTeam.colors.background}
            teamNameColor={visitorTeam.colors.name}
            setTeamPlayersView={() => setTeamPlayersView(visitorTeam)}
          />
          <div className="scorer">
            {scorer?.playerName ? scorer?.playerName : null}
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
