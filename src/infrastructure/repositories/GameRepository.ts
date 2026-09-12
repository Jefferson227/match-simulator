import { GameState } from '../../game-engine/GameState';
import { SAVE_VERSION, SavedGameState } from '../data-transfer-objects/GameStateSaveDTO';
import GameStateMapper from '../mappers/GameStateMapper';

const GAME_STORAGE_KEY = 'match-simulator-game-state-v2';

/**
 * The pre-MS-108 key, which held a whole `GameState` with every squad duplicated once per fixture.
 * Those saves are abandoned rather than migrated: the key is cleared on the next load so a stale
 * payload does not sit in a quota this project needs.
 */
const LEGACY_GAME_STORAGE_KEY = 'match-simulator-game-state';

const NOT_FOUND = 'Saved game could not be found.';

/** Matches the `saveVersion` field of a readable payload, so `hasSavedGame` never has to parse. */
const SAVE_VERSION_PATTERN = new RegExp(`"saveVersion"\\s*:\\s*${SAVE_VERSION}\\s*[,}]`);

function readSavedGame(): SavedGameState | null {
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);

  const savedState = window.localStorage.getItem(GAME_STORAGE_KEY);
  if (!savedState) {
    return null;
  }

  const parsed = JSON.parse(savedState) as SavedGameState;
  return parsed?.saveVersion === SAVE_VERSION ? parsed : null;
}

function saveGame(state: GameState): void {
  window.localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(GameStateMapper.dehydrate(state)));
}

function loadGame(): GameState {
  const parsed = readSavedGame();
  if (!parsed) {
    throw new Error(NOT_FOUND);
  }

  return GameStateMapper.hydrate(parsed);
}

/**
 * Whether a readable save exists, without parsing or rebuilding the container. `InitialScreen` asks
 * this on mount to decide whether to offer *continue*; parsing and hydrating a men's season to
 * answer it costs megabytes of work for a boolean.
 *
 * The version is read off the raw string, so the cost is a scan rather than a parse.
 */
function hasSavedGame(): boolean {
  window.localStorage.removeItem(LEGACY_GAME_STORAGE_KEY);

  const savedState = window.localStorage.getItem(GAME_STORAGE_KEY);
  return savedState !== null && SAVE_VERSION_PATTERN.test(savedState);
}

export default {
  hasSavedGame,
  loadGame,
  saveGame,
};
