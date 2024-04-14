import React, { useState, useEffect, useMemo } from 'react';
import GoalScorer from '../../interfaces/GoalScorer';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import './TeamContainer.css';

const MatchSimulator: React.FC = () => {
  const homeTeam = useMemo(() => Functions.loadHomeTeam(), []);
  const visitorTeam = useMemo(() => Functions.loadVisitorTeam(), []);
  const [homeTeamScore, setHomeTeamScore] = useState(0);
  const [visitorTeamScore, setVisitorTeamScore] = useState(0);
  const [scorer, setScorer] = useState<GoalScorer | null>(null);
  const [time, setTime] = useState(0);

  // If this useEffect becomes more complex, think about creating a custom useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);

    if (time >= 90) {
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
  }, [time, homeTeam, visitorTeam]);

  return (
    <div className="match-simulator">
      <div className="timebar" style={{ width: `${(time * 100) / 90}%` }}>
        <p className="time">{`${time}'`}</p>
      </div>

      <div className="scoreboard" style={{ display: 'none' }}>
        <TeamComponent
          name={homeTeam.abbreviation}
          outlineColor={homeTeam.colors.outline}
          backgroundColor={homeTeam.colors.background}
          teamNameColor={homeTeam.colors.name}
        />
        <Score homeScore={homeTeamScore} guestScore={visitorTeamScore} />
        <TeamComponent
          name={visitorTeam.abbreviation}
          outlineColor={visitorTeam.colors.outline}
          backgroundColor={visitorTeam.colors.background}
          teamNameColor={visitorTeam.colors.name}
        />
        <div className="scorer">
          {scorer?.playerName ? scorer?.playerName : null}
        </div>
      </div>

      <div className="team-players">
        <div
          className="team-container"
          style={{
            backgroundColor: homeTeam.colors.background,
            outlineColor: homeTeam.colors.outline,
          }}
        >
          <div
            className="team-name"
            style={{
              color: homeTeam.colors.name,
              borderColor: homeTeam.colors.outline,
            }}
          >
            {homeTeam.name}
          </div>
          <div
            className="formation"
            style={{ borderColor: homeTeam.colors.outline }}
          >
            4-3-3
          </div>
          <div className="players">
            {homeTeam.players.map((player) => (
              <div className="player" style={{ color: homeTeam.colors.name }}>
                <div className="position">{player.position}</div>
                <div className="name">{player.name}</div>
                <div className="strength">{player.strength}</div>
              </div>
            ))}
          </div>
          <div className="substitute-button-container">
            <button
              className="substitute-button"
              style={{
                backgroundColor: homeTeam.colors.background,
                outlineColor: homeTeam.colors.outline,
                color: homeTeam.colors.name,
              }}
            >
              SEE SUBSTITUTES
            </button>
          </div>
        </div>

        <div className="footer-buttons-container">
          <div className="back-to-main-team" style={{ display: 'none' }}>
            <button>BACK TO MAIN TEAM</button>
          </div>
          <button className="back-to-match">BACK TO MATCH</button>
        </div>
      </div>
    </div>
  );
};

export default MatchSimulator;
