import { Player } from '../types';

function getSum(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

function getAverage(numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0) / numbers.length;
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addPlayerAttributes(players: Player[]): Player[] {
  return players
    .map((player) => {
      const updatedPlayer = { ...player };
      updatedPlayer.id = Math.floor(Math.random() * 10000);
      updatedPlayer.order = getPlayerOrder(player.position);
      updatedPlayer.mood = getRandomNumber(0, 100);
      return updatedPlayer;
    })
    .sort((a, b) => {
      if ((a.order ?? 0) < (b.order ?? 0)) {
        return -1; // a comes before b
      }
      if ((a.order ?? 0) > (b.order ?? 0)) {
        return 1; // a comes after b
      }
      return 0; // a and b are equal
    });
}

function getPlayerOrder(position: string): number {
  switch (position) {
    case 'GK': {
      return 0;
    }
    case 'DF': {
      return 1;
    }
    case 'MF': {
      return 2;
    }
    case 'FW': {
      return 3;
    }
    default: {
      return 0;
    }
  }
}

function getPlayerPosition(
  position: 'defense' | 'midfield' | 'attack'
): 'GK' | 'DF' | 'MF' | 'FW' {
  switch (position) {
    case 'defense': {
      return 'GK';
    }
    case 'midfield': {
      return 'MF';
    }
    case 'attack': {
      return 'FW';
    }
    default: {
      return 'MF';
    }
  }
}

function getOpposingPosition(
  position: 'defense' | 'midfield' | 'attack'
): 'defense' | 'midfield' | 'attack' {
  switch (position) {
    case 'attack': {
      return 'defense';
    }
    case 'midfield': {
      return position;
    }
    case 'defense': {
      return 'attack';
    }
    default: {
      return position;
    }
  }
}

function getNextFieldArea(
  position: 'defense' | 'midfield' | 'attack'
): 'defense' | 'midfield' | 'attack' {
  switch (position) {
    case 'defense': {
      return 'midfield';
    }
    case 'midfield': {
      return 'attack';
    }
    case 'attack': {
      return position;
    }
    default: {
      return position;
    }
  }
}

function getPreviousFieldArea(
  position: 'defense' | 'midfield' | 'attack'
): 'defense' | 'midfield' | 'attack' {
  switch (position) {
    case 'defense': {
      return position;
    }
    case 'midfield': {
      return 'defense';
    }
    case 'attack': {
      return 'midfield';
    }
    default: {
      return position;
    }
  }
}

function getTeamFormation(team: { players: { position: string }[] }): string {
  const defenders = team.players.filter((p) => p.position === 'DF').length;
  const midfielders = team.players.filter((p) => p.position === 'MF').length;
  const forwards = team.players.filter((p) => p.position === 'FW').length;
  return `${defenders}-${midfielders}-${forwards}`;
}

function getTeamMoralePercentage(team: { morale: number }): number {
  // The morale percentage can vary from -30% to 30%
  // If the morale is more than 50, the percentage is positive
  // 50 represents 30%, and the morale number from the team is calculated proportionally based on that
  if (team.morale >= 50) {
    // 50 -> 30%
    // morale (68) -> moralePercentage

    // moralePercentage * 50 = 30 * morale (68)

    // moralePercentage = 30 * morale (68) / 50
    return (30 * team.morale) / 50;
  }

  // If the morale is less than 50, the percentage is negative
  // Let's say "50" is "0"
  // So if the morale is 35, the morale for the calculation is 50 - 35 = 15
  // and we get 15 + 50 = 65, which is the morale for the calculation
  const calculatedMorale = 100 - team.morale;
  return ((30 * (50 - calculatedMorale)) / 50) * -1;
}

function getMaxTeamStrength(
  team: { players: { strength: number; position: string }[] },
  position: string
): number {
  // TODO: Get the team morale and players' mood
  // The team morale can add or remove up to 30% to the team strength
  // The players' mood can add or remove up to 10% to the team strength

  return team.players
    .filter((p) => p.position === position)
    .reduce((acc, player) => acc + player.strength, 0);
}

const utils = {
  addPlayerAttributes,
  getRandomNumber,
  getAverage,
  getSum,
  getPlayerPosition,
  getOpposingPosition,
  getPreviousFieldArea,
  getNextFieldArea,
  getTeamFormation,
  getMaxTeamStrength,
};

export default utils;
