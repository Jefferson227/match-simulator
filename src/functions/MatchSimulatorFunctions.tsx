import Player from '../interfaces/Player';
import Team from '../interfaces/Team';
const HOME_TEAM = '../assets/ceara.json';
const VISITOR_TEAM = '../assets/fortaleza.json';

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

async function fetchData(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function loadHomeTeam(): Promise<Team> {
  return (await fetchData(HOME_TEAM)) as Team;
}

async function loadVisitorTeam(): Promise<Team> {
  return (await fetchData(VISITOR_TEAM)) as Team;
}

const MatchSimulatorFunctions = {
  generatePlayers,
  loadHomeTeam,
  loadVisitorTeam,
};

export default MatchSimulatorFunctions;
