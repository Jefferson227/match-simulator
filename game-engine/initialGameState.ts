import { Championship } from '../core/models/Championship';
import type { GameState } from './game-state';

export function createInitialGameState(): GameState {
  return {
    championshipContainer: {
      playableChampionship: {} as Championship,
      promotionChampionship: {} as Championship,
      relegationChampionship: {} as Championship,
    },
  };
}
