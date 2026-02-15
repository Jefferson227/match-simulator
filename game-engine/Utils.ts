import Match from '../core/models/Match';
import { GameState } from './game-state';

export function getMatchesFromCurrentRound(state: GameState): Match[] {
  const currentRound = state.championshipContainer.playableChampionship.matchContainer.currentRound;
  const round = state.championshipContainer.playableChampionship.matchContainer.rounds.find(
    (round) => round.number === currentRound
  );

  if (!round) return [];

  return round.matches;
}
