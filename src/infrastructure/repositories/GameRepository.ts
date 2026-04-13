import { GameState } from '../../game-engine/GameState';

const GAME_STORAGE_KEY = 'match-simulator-game-state';

function saveGame(state: GameState): void {
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
}

function loadGame(): GameState {
  const savedState = window.localStorage.getItem(GAME_STORAGE_KEY);
  if (!savedState) {
    throw new Error('Saved game could not be found.');
  }

  return JSON.parse(savedState) as GameState;
}

export default {
  loadGame,
  saveGame,
};
