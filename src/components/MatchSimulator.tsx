import React, { useState, useEffect } from "react";

interface Player {
  firstName: string;
  lastName: string;
  strength: number;
  position: "goalkeeper" | "defender" | "midfielder" | "forward";
}

interface Team {
  name: string;
  score: number;
  players: Player[];
}

interface GoalScorer {
  firstName: string;
  lastName: string;
  time: number;
}

const TeamComponent: React.FC<Team> = ({ name, score, players }) => (
  <div className="team">
    <h2>{name}</h2>
    <p>Score: {score}</p>
    {/*players.map((player, index) => (
      <p key={index}>
        {player.firstName} {player.lastName} ({player.position})
      </p>
    ))*/}
  </div>
);

const MatchSimulator: React.FC = () => {
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
      const goalScorer: GoalScorer = {
        firstName: "Player",
        lastName: "A",
        time,
      };
      setCearaScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    } else if (time === 30) {
      const goalScorer: GoalScorer = {
        firstName: "Player",
        lastName: "B",
        time,
      };
      setFortalezaScore((prevScore) => prevScore + 1);
      setScorer(goalScorer);
    }

    return () => clearInterval(timer);
  }, [time]);

  const generateRandomName = (): string => {
    const firstName = ["Carlos", "Rafael", "Felipe", "Lucas", "Gustavo"];
    const lastName = ["Silva", "Santos", "Oliveira", "Souza", "Ferreira"];
    const randomFirstName =
      firstName[Math.floor(Math.random() * firstName.length)];
    const randomLastName =
      lastName[Math.floor(Math.random() * lastName.length)];
    return `${randomFirstName} ${randomLastName}`;
  };

  const generateRandomStrength = (): number => {
    return Math.floor(Math.random() * 100) + 1;
  };

  const generateRandomPosition = (): Player["position"] => {
    const positions: Player["position"][] = [
      "goalkeeper",
      "defender",
      "midfielder",
      "forward",
    ];
    return positions[Math.floor(Math.random() * positions.length)];
  };

  const generatePlayers = (teamName: string): Player[] => {
    const players: Player[] = [];

    // Generate Goalkeeper
    const goalkeeper: Player = {
      firstName: generateRandomName(),
      lastName: generateRandomName(),
      strength: generateRandomStrength(),
      position: "goalkeeper",
    };
    players.push(goalkeeper);

    // Generate Outfield Players
    for (let i = 1; i <= 10; i++) {
      const player: Player = {
        firstName: generateRandomName(),
        lastName: generateRandomName(),
        strength: generateRandomStrength(),
        position: generateRandomPosition(),
      };
      players.push(player);
    }

    return players;
  };

  const cearaPlayers: Player[] = generatePlayers("Ceará");
  const fortalezaPlayers: Player[] = generatePlayers("Fortaleza");

  return (
    <div className="match-simulator">
      <TeamComponent name="Ceará" score={cearaScore} players={cearaPlayers} />
      <div className="middle">Time: {time}</div>
      <TeamComponent
        name="Fortaleza"
        score={fortalezaScore}
        players={fortalezaPlayers}
      />
    </div>
  );
};

export default MatchSimulator;
