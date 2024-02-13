import Player from '../interfaces/Player';

function generateRandomFirstName(): string {
  const firstName = [
    'Carlos',
    'Rafael',
    'Felipe',
    'Lucas',
    'Gustavo',
  ];
  return firstName[Math.floor(Math.random() * firstName.length)];
}

function generateRandomLastName(): string {
  const lastName = [
    'Silva',
    'Santos',
    'Oliveira',
    'Souza',
    'Ferreira',
  ];
  return lastName[Math.floor(Math.random() * lastName.length)];
}

function generateRandomStrength(): number {
  return Math.floor(Math.random() * 100) + 1;
}

function generateRandomPosition(): Player['position'] {
  const positions: Player['position'][] = [
    'goalkeeper',
    'defender',
    'midfielder',
    'forward',
  ];
  return positions[Math.floor(Math.random() * positions.length)];
}

function generatePlayers(): Player[] {
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
}

const MatchSimulatorFunctions = {
  generatePlayers,
};

export default MatchSimulatorFunctions;
