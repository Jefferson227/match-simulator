import PlayerPosition from '../../enums/PlayerPosition';
import Player from '../../models/Player';
import { Team } from '../../models/Team';
import FieldArea from '../../enums/FieldArea';

function getTeamMoralePercentage(team: Team): number {
  if (team.morale >= 50) {
    return Math.round((30 * (team.morale - 50)) / 50);
  }

  return Math.round(((30 * team.morale) / 50) * -1);
}

function getStarters(team: Team): Player[] {
  const starters = team.players.filter((player) => player.isStarter);
  return starters.length ? starters : team.players;
}

function sumStrength(players: Player[]): number {
  return players.reduce((acc, player) => acc + player.strength, 0);
}

function applyMorale(baseStrength: number, team: Team): number {
  const moraleMultiplier = 1 + getTeamMoralePercentage(team) / 100;
  return Math.max(1, Math.round(baseStrength * moraleMultiplier));
}

export function getPlayerPositionFromFieldArea(fieldArea: FieldArea): PlayerPosition {
  if (fieldArea === 'defense') return 'DF';
  if (fieldArea === 'attack') return 'FW';
  return 'MF';
}

export function getOpposingFieldArea(fieldArea: FieldArea): FieldArea {
  if (fieldArea === 'attack') return 'defense';
  if (fieldArea === 'defense') return 'attack';
  return 'midfield';
}

export function getNextFieldArea(fieldArea: FieldArea): FieldArea {
  if (fieldArea === 'defense') return 'midfield';
  if (fieldArea === 'midfield') return 'attack';
  return 'attack';
}

export function getPreviousFieldArea(fieldArea: FieldArea): FieldArea {
  if (fieldArea === 'attack') return 'midfield';
  if (fieldArea === 'midfield') return 'defense';
  return 'defense';
}

export function getTeamStrengthForDispute(team: Team, position: PlayerPosition): number {
  const starters = getStarters(team);
  const playersOnPosition = starters.filter((player) => player.position === position);
  const players = playersOnPosition.length ? playersOnPosition : starters;
  return applyMorale(sumStrength(players), team);
}

export function getDefenseStrengthForDispute(team: Team): number {
  const starters = getStarters(team);
  const defenders = starters.filter(
    (player) => player.position === 'GK' || player.position === 'DF'
  );
  const players = defenders.length ? defenders : starters;
  return applyMorale(sumStrength(players), team);
}

export function getShooterCandidates(team: Team, fieldArea: FieldArea): Player[] {
  const starters = getStarters(team);
  const position = getPlayerPositionFromFieldArea(fieldArea);
  const playersOnPosition = starters.filter((player) => player.position === position);
  return playersOnPosition.length ? playersOnPosition : starters;
}

export function getShooterStrengthForDispute(player: Player, team: Team): number {
  return applyMorale(player.strength, team);
}
