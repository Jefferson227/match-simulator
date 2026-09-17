import type { GameState } from './GameState';

export function createInitialGameState(): GameState {
  return {
    championshipContainer: {
      championships: [],
      playableInternalName: '',
    },
    leagueType: 'mens',
    coachName: '',
  };
}
