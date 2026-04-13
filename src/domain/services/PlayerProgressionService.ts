import { BASE_DOWN_XP, BASE_UP_XP, BASE_XP_SCALE } from '../constants/PlayerProgressConstants';
import { MATCH_RESULT } from '../constants/MatchResultConstants';
import {
  MID_STRENGTH,
  STABILITY_FACTOR,
  XP_PER_STRENGTH,
} from '../constants/PlayerProgressConstants';
import MatchResult from '../enums/MatchResult';
import Player from '../models/Player';
import Round from '../models/Round';
import { Team } from '../models/Team';

function getTeamResult(team: Team, round?: Round): MatchResult | null {
  if (!round) return null;

  const match = round.matches.find(
    (currentMatch) => currentMatch.homeTeam.id === team.id || currentMatch.awayTeam.id === team.id
  );
  if (!match) return null;

  const isHomeTeam = match.homeTeam.id === team.id;
  const teamScore = isHomeTeam ? match.homeTeamScore : match.awayTeamScore;
  const opponentScore = isHomeTeam ? match.awayTeamScore : match.homeTeamScore;

  if (teamScore > opponentScore) return MATCH_RESULT.WIN;
  if (teamScore < opponentScore) return MATCH_RESULT.LOSS;
  return MATCH_RESULT.DRAW;
}

function getLastFiveResults(team: Team, rounds: Round[] = []): MatchResult[] {
  const finishedRounds = rounds
    .filter((round) => round.status === 'ended')
    .sort((leftRound, rightRound) => rightRound.number - leftRound.number);

  const results: MatchResult[] = [];

  for (let i = 0; i < finishedRounds.length && results.length < 5; i++) {
    const result = getTeamResult(team, finishedRounds[i]);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

function getResultValue(lastFiveResults: MatchResult[]): number {
  let total = 0;

  for (let i = 0; i < lastFiveResults.length; i++) {
    const result = lastFiveResults[i];
    if (result === MATCH_RESULT.WIN) total += 1.0;
    if (result === MATCH_RESULT.DRAW) total += 0.2;
    if (result === MATCH_RESULT.LOSS) total -= 0.8;
  }

  return total / 5;
}

function getMoraleMultiplier(teamMorale: number): number {
  return 0.8 + (teamMorale / 100) * 0.4;
}

function getGrowthBias(strength: number): number {
  return 0.3 + 0.7 * ((101 - strength) / 100);
}

function getRandomness(randomProvider: () => number = Math.random): number {
  return randomProvider() * 2 - 1;
}

function computeXpDelta(
  lastFiveResults: MatchResult[],
  teamMorale: number,
  strength: number,
  randomProvider?: () => number
): number {
  const resultValue = getResultValue(lastFiveResults);
  const moraleMultiplier = getMoraleMultiplier(teamMorale);
  const growthBias = getGrowthBias(strength);
  const randomness = getRandomness(randomProvider);

  return BASE_XP_SCALE * resultValue * moraleMultiplier * growthBias + randomness;
}

function xpToLevelUp(strength: number): number {
  return BASE_UP_XP + XP_PER_STRENGTH * strength;
}

function xpToLevelDown(strength: number): number {
  return BASE_DOWN_XP + STABILITY_FACTOR * Math.abs(strength - MID_STRENGTH);
}

function clampStrength(strength: number): number {
  return Math.max(1, Math.min(100, strength));
}

function updatePlayerStrength(
  player: Player,
  teamMorale: number,
  lastFiveResults: MatchResult[],
  randomProvider?: () => number
): Player {
  const currentXp = typeof player.xp === 'number' ? player.xp : 0;
  let updatedPlayer: Player = {
    ...player,
    xp: currentXp + computeXpDelta(lastFiveResults, teamMorale, player.strength, randomProvider),
  };

  while (updatedPlayer.strength < 100 && updatedPlayer.xp >= xpToLevelUp(updatedPlayer.strength)) {
    updatedPlayer = {
      ...updatedPlayer,
      xp: updatedPlayer.xp - xpToLevelUp(updatedPlayer.strength),
      strength: updatedPlayer.strength + 1,
    };
  }

  while (updatedPlayer.strength > 1 && updatedPlayer.xp <= -xpToLevelDown(updatedPlayer.strength)) {
    updatedPlayer = {
      ...updatedPlayer,
      xp: updatedPlayer.xp + xpToLevelDown(updatedPlayer.strength),
      strength: updatedPlayer.strength - 1,
    };
  }

  return {
    ...updatedPlayer,
    strength: clampStrength(updatedPlayer.strength),
  };
}

function updatePlayers(
  players: Player[],
  teamMorale: number,
  team: Team,
  rounds: Round[] = [],
  randomProvider?: () => number
): Player[] {
  const lastFiveResults = getLastFiveResults(team, rounds);

  return players.map((player) =>
    updatePlayerStrength(player, teamMorale, lastFiveResults, randomProvider)
  );
}

export default {
  getTeamResult,
  getLastFiveResults,
  getResultValue,
  getMoraleMultiplier,
  getGrowthBias,
  getRandomness,
  computeXpDelta,
  xpToLevelUp,
  xpToLevelDown,
  updatePlayerStrength,
  updatePlayers,
};
