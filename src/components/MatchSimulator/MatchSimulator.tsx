import React, { useState, useEffect, useMemo } from 'react';
import GoalScorer from '../../interfaces/GoalScorer';
import Team from '../../interfaces/Team';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import TeamPlayers from '../TeamPlayers/TeamPlayers';

const MatchSimulator: React.FC = () => {
  const homeTeam = useMemo(() => Functions.loadHomeTeam(), []);
  const visitorTeam = useMemo(() => Functions.loadVisitorTeam(), []);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [visitorTeamScore, setVisitorTeamScore] = useState(0);
  const [scorer, setScorer] = useState<GoalScorer | null>(null);
  const [time, setTime] = useState(0);
  const [teamPlayersState, setTeamPlayersState] = useState<Team | null>(null);

  // If this useEffect becomes more complex, think about creating a custom useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    if (time >= 90 || teamPlayersState !== null) {
      clearInterval(timer);
    }

    // Simulate match events (e.g., goals)
    if (time === 15) {
      const homeTeamScorer =
        homeTeam?.players[Math.floor(Math.random() * homeTeam.players.length)];

      if (homeTeamScorer) {
        const goalScorer: GoalScorer = {
          playerName: homeTeamScorer.name,
          time,
        };

        setHomeTeamScore((prevScore) => prevScore + 1);
        setScorer(goalScorer);
      }
    } else if (time === 30) {
      const visitorTeamScorer =
        visitorTeam?.players[
          Math.floor(Math.random() * visitorTeam.players.length)
        ];

      if (visitorTeamScorer) {
        const goalScorer: GoalScorer = {
          playerName: visitorTeamScorer.name,
          time,
        };

        setVisitorTeamScore((prevScore) => prevScore + 1);
        setScorer(goalScorer);
      }
    }

    return () => clearInterval(timer);
  }, [time, homeTeam, visitorTeam, teamPlayersState]);

  return (
    <div className="match-simulator">
      <div className="timebar" style={{ width: `${(time * 100) / 90}%` }}>
        <p className="time">{`${time}'`}</p>
      </div>

      {teamPlayersState === null ? (
        <div className="scoreboard">
          <TeamComponent
            name={homeTeam.abbreviation}
            outlineColor={homeTeam.colors.outline}
            backgroundColor={homeTeam.colors.background}
            teamNameColor={homeTeam.colors.name}
            setTeamPlayersState={() => setTeamPlayersState(homeTeam)}
          />
          <Score homeScore={homeTeamScore} guestScore={visitorTeamScore} />
          <TeamComponent
            name={visitorTeam.abbreviation}
            outlineColor={visitorTeam.colors.outline}
            backgroundColor={visitorTeam.colors.background}
            teamNameColor={visitorTeam.colors.name}
            setTeamPlayersState={() => setTeamPlayersState(visitorTeam)}
          />
          <div className="scorer">
            {scorer?.playerName ? scorer?.playerName : null}
          </div>
        </div>
      ) : null}

      {teamPlayersState !== null ? (
        <TeamPlayers
          team={teamPlayersState}
          resetTeamPlayersState={() => setTeamPlayersState(null)}
        />
      ) : null}
    </div>
  );
};

export default MatchSimulator;
