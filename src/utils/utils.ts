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
      return 'DF';
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
  // A value of 50 represents 30%, and the morale number from the team is calculated proportionally
  // If the morale is greater or equals than 50, the percentage is positive
  // If the morale is less than 50, the percentage is negative
  if (team.morale >= 50) {
    const calculatedMorale = team.morale - 50;
    return Math.round((30 * calculatedMorale) / 50);
  }

  return Math.round(((30 * team.morale) / 50) * -1);
}

function getTeamMoodPercentage(team: { overallMood: number }): number {
  // The mood percentage can vary from -10% to 10%
  // A value of 50 represents 10%, and the overall mood number from the team is calculated proportionally
  // If the mood is greater or equals than 50, the percentage is positive
  // If the mood is less than 50, the percentage is negative
  if (team.overallMood >= 50) {
    const calculatedMood = team.overallMood - 50;
    return Math.round((10 * calculatedMood) / 50);
  }

  return Math.round(((10 * team.overallMood) / 50) * -1);
}

function getMaxTeamStrength(
  team: {
    players: { strength: number; position: string }[];
    morale: number;
    overallMood: number;
  },
  position: string
): number {
  // The team morale can add or remove up to 30% to the team strength
  // The players' mood can add or remove up to 10% to the team strength
  const teamMoralePercentage = getTeamMoralePercentage(team);
  const teamMoodPercentage = getTeamMoodPercentage(team);
  const teamStrength = team.players
    .filter((p) => p.position === position)
    .reduce((acc, player) => acc + player.strength, 0);

  return Math.round(
    teamStrength *
      (1 + teamMoralePercentage / 100) *
      (1 + teamMoodPercentage / 100)
  );
}

function getMaxDefenseStrength(team: {
  players: { strength: number; position: string }[];
  morale: number;
  overallMood: number;
}): number {
  // The team morale can add or remove up to 30% to the team strength
  // The players' mood can add or remove up to 10% to the team strength
  const teamMoralePercentage = getTeamMoralePercentage(team);
  const teamMoodPercentage = getTeamMoodPercentage(team);
  const teamStrength = team.players
    .filter((p) => p.position === 'DF' || p.position === 'GK')
    .reduce((acc, player) => acc + player.strength, 0);

  return Math.round(
    teamStrength *
      (1 + teamMoralePercentage / 100) *
      (1 + teamMoodPercentage / 100)
  );
}

function getPlayerMoodPercentage(player: { mood: number }): number {
  // The mood percentage can vary from -10% to 10%
  // A value of 50 represents 10%, and the mood number from the player is calculated proportionally
  // If the mood is greater or equals than 50, the percentage is positive
  // If the mood is less than 50, the percentage is negative
  if (player.mood >= 50) {
    const calculatedMood = player.mood - 50;
    return Math.round((10 * calculatedMood) / 50);
  }

  return Math.round(((10 * player.mood) / 50) * -1);
}

function getMaxShooterStrength(
  player: { strength: number; mood: number },
  team: { morale: number }
): number {
  const teamMoralePercentage = getTeamMoralePercentage(team);
  const playerMoodPercentage = getPlayerMoodPercentage(player);

  return (
    player.strength *
    (1 + teamMoralePercentage / 100) *
    (1 + playerMoodPercentage / 100)
  );
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
  getMaxShooterStrength,
  getMaxDefenseStrength,
};

export default utils;
