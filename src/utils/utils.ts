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
};

export default utils;
