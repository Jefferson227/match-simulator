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
          name="CEA"
          outlineColor="#e2e2e2"
          backgroundColor="#1e1e1e"
          teamNameColor="#e2e2e2"
        />
        <Score homeScore={homeTeamScore} guestScore={visitorTeamScore} />
        <TeamComponent
          name="FOR"
          outlineColor="#fe3b3b"
          backgroundColor="#1263ff"
          teamNameColor="#e2e2e2"
        />
        <div className="scorer">
          {scorer?.playerName ? scorer?.playerName : null}
        </div>
      </div>

      <div className="team-players">
        <div className="team-container">
          <div className="team-name">CEARÁ SPORTING CLUB</div>
          <div className="formation">4-3-3</div>
          <div className="players">
            <div className="player">
              <div className="position">GK</div>
              <div className="name">RICHARD</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">DF</div>
              <div className="name">DAVID RICARDO</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">DF</div>
              <div className="name">MATHEUS BAHIA</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">DF</div>
              <div className="name">RAÍ RAMOS</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">MF</div>
              <div className="name">RICHARDSON</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">MF</div>
              <div className="name">LOURENÇO</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">MF</div>
              <div className="name">G. CASTILHO</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">FW</div>
              <div className="name">ERICK PULGA</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">FW</div>
              <div className="name">BARCELÓ</div>
              <div className="strength">99</div>
            </div>
            <div className="player">
              <div className="position">FW</div>
              <div className="name">AYLON</div>
              <div className="strength">99</div>
            </div>
          </div>
          <div className="substitute-button-container">
            <button className="substitute-button">SEE SUBSTITUTES</button>
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
