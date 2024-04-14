import React, { useState, useEffect, useMemo } from 'react';
import GoalScorer from '../../interfaces/GoalScorer';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';
import './TeamContainer.css';

const MatchSimulator: React.FC = () => {
  const cearaPlayers = useMemo(() => Functions.generatePlayers(), []);
  const fortalezaPlayers = useMemo(() => Functions.generatePlayers(), []);
  const [cearaScore, setCearaScore] = useState(0);
  const [fortalezaScore, setFortalezaScore] = useState(0);
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
      const cearaScorer =
        cearaPlayers[Math.floor(Math.random() * cearaPlayers.length)];
      const goalScorer: GoalScorer = {
        firstName: cearaScorer.firstName,
        lastName: cearaScorer.lastName,
        time,
      };
      setCearaScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    } else if (time === 30) {
      const fortalezaScorer =
        fortalezaPlayers[Math.floor(Math.random() * fortalezaPlayers.length)];
      const goalScorer: GoalScorer = {
        firstName: fortalezaScorer.firstName,
        lastName: fortalezaScorer.lastName,
        time,
      };
      setFortalezaScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    }

    return () => clearInterval(timer);
  }, [time, cearaPlayers, fortalezaPlayers]);

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
          nameColor="#e2e2e2"
        />
        <Score homeScore={cearaScore} guestScore={fortalezaScore} />
        <TeamComponent
          name="FOR"
          outlineColor="#fe3b3b"
          backgroundColor="#1263ff"
          nameColor="#e2e2e2"
        />
        <div className="scorer">
          {scorer?.firstName
            ? `${scorer?.firstName} ${scorer?.lastName}`
            : null}
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
            <button>SEE SUBSTITUTES</button>
          </div>
        </div>

        <div className="bottom-buttons">
          <div className="back-to-main-team">
            <button>BACK TO MAIN TEAM</button>
          </div>
          <div className="back-to-match">BACK TO MATCH</div>
        </div>
      </div>
    </div>
  );
};

export default MatchSimulator;
