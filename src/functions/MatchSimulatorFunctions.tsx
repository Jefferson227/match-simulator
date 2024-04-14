import Player from '../interfaces/Player';
import Team from '../interfaces/Team';
import homeTeam from '../assets/ceara.json';
import visitorTeam from '../assets/fortaleza.json';

function generateRandomFirstName(): string {
  const firstName = ['Carlos', 'Rafael', 'Felipe', 'Lucas', 'Gustavo'];
  return firstName[Math.floor(Math.random() * firstName.length)];
}

function generateRandomStrength(): number {
  return Math.floor(Math.random() * 100) + 1;
}

function generateRandomPosition(): Player['position'] {
  const positions: Player['position'][] = ['GK', 'DF', 'MF', 'FW'];
  return positions[Math.floor(Math.random() * positions.length)];
}

function generatePlayers(): Player[] {
  const players: Player[] = [];

  // Generate Goalkeeper
  const goalkeeper: Player = {
    name: generateRandomFirstName(),
    strength: generateRandomStrength(),
    position: 'GK',
  };
  players.push(goalkeeper);

  // Generate Outfield Players
  for (let i = 1; i <= 10; i++) {
    const player: Player = {
      name: generateRandomFirstName(),
      strength: generateRandomStrength(),
      position: generateRandomPosition(),
    };
    players.push(player);
  }

  return players;
}

function loadHomeTeam(): Team {
  return homeTeam as Team;
}

function loadVisitorTeam(): Team {
  return visitorTeam as Team;
}

const MatchSimulatorFunctions = {
  generatePlayers,
  loadHomeTeam,
  loadVisitorTeam,
};

export default MatchSimulatorFunctions;
