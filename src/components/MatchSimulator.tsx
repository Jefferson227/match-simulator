import React, { useState, useEffect, useMemo } from 'react';
import GoalScorer from '../interfaces/GoalScorer';
import ScoreBoard from './ScoreBoard';
import TeamComponent from './TeamComponent';
import Functions from '../functions/MatchSimulatorFunctions';

const MatchSimulator: React.FC = () => {
  const cearaPlayers = useMemo(() => Functions.generatePlayers(), []);
  const fortalezaPlayers = useMemo(
    () => Functions.generatePlayers(),
    []
  );
  const [cearaScore, setCearaScore] = useState(0);
  const [fortalezaScore, setFortalezaScore] = useState(0);
  const [scorer, setScorer] = useState<GoalScorer | null>(null);
  const [time, setTime] = useState(0);

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
        fortalezaPlayers[
          Math.floor(Math.random() * fortalezaPlayers.length)
        ];
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
      <TeamComponent name="Ceará" score={cearaScore} />
      <div className="middle">Time: {time}</div>
      <TeamComponent name="Fortaleza" score={fortalezaScore} />
      {scorer !== null ? <ScoreBoard goalScorer={scorer} /> : null}
    </div>
  );
};

export default MatchSimulator;
