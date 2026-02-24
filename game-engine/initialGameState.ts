import type { GameState } from './GameState';
import { Championship } from '../core/models/Championship';

export function createInitialGameState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: {} as Championship,
      promotionChampionship: {} as Championship,
      relegationChampionship: {} as Championship,
    },
  };
}
