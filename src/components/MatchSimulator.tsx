import React, { useState, useEffect, useMemo } from 'react';

interface Player {
  firstName: string;
  lastName: string;
  strength: number;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
}

interface Team {
  name: string;
  score: number;
}

interface GoalScorer {
  firstName: string;
  lastName: string;
  time: number;
}

interface ScoreBoardProps {
  goalScorer: GoalScorer;
}

const generateRandomFirstName = (): string => {
  const firstName = [
    'Carlos',
    'Rafael',
    'Felipe',
    'Lucas',
    'Gustavo',
  ];
  return firstName[Math.floor(Math.random() * firstName.length)];
};

const generateRandomLastName = (): string => {
  const lastName = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Ferreira',
  ];
  return lastName[Math.floor(Math.random() * lastName.length)];
};

const generateRandomStrength = (): number => {
  return Math.floor(Math.random() * 100) + 1;
};

const generateRandomPosition = (): Player['position'] => {
  const positions: Player['position'][] = [
    'goalkeeper',
    'defender',
    'midfielder',
    'forward',
  ];
  return positions[Math.floor(Math.random() * positions.length)];
};

const generatePlayers = (): Player[] => {
  const players: Player[] = [];

  // Generate Goalkeeper
  const goalkeeper: Player = {
    firstName: generateRandomFirstName(),
    lastName: generateRandomLastName(),
    strength: generateRandomStrength(),
    position: 'goalkeeper',
  };
  players.push(goalkeeper);

  // Generate Outfield Players
  for (let i = 1; i <= 10; i++) {
    const player: Player = {
      firstName: generateRandomFirstName(),
      lastName: generateRandomLastName(),
      strength: generateRandomStrength(),
      position: generateRandomPosition(),
    };
    players.push(player);
  }

  return players;
};

const TeamComponent: React.FC<Team> = ({ name, score }) => (
  <div className="team">
    <h2>{name}</h2>
    <p>{score}</p>
  </div>
);

const ScoreBoard: React.FC<ScoreBoardProps> = ({ goalScorer }) => {
  if (goalScorer === null) {
    return null;
  }

  return (
    <div className="scoreboard">
      <p>
        {goalScorer.firstName} {goalScorer.lastName} {goalScorer.time}
        '
      </p>
    </div>
  );
};

const MatchSimulator: React.FC = () => {
  const cearaPlayers = useMemo(() => generatePlayers(), []);
  const fortalezaPlayers = useMemo(() => generatePlayers(), []);
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
