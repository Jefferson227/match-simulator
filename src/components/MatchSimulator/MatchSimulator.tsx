import React, { useState, useEffect, useMemo } from 'react';
import GoalScorer from '../../interfaces/GoalScorer';
import Score from '../Score';
import TeamComponent from '../TeamComponent';
import Functions from '../../functions/MatchSimulatorFunctions';
import './MatchSimulator.css';

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

      <div className="scoreboard">
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
    </div>
  );
};

export default MatchSimulator;
