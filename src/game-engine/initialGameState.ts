import type { GameState } from './GameState';
import { Championship } from '../domain/models/Championship';

export function createInitialGameState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: {} as Championship,
      promotionChampionship: {} as Championship,
      relegationChampionship: {} as Championship,
    },
  };
}
