import GameRepository from '../../infrastructure/repositories/GameRepository';
import { GameState } from '../../game-engine/GameState';
import OperationResult from '../results/OperationResult';

const saveGame = (state: GameState): OperationResult<void> => {
  try {
    GameRepository.saveGame(state);

    const result = new OperationResult<void>(undefined);
    result.setSuccess();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<void>(undefined);
    result.setError({
      errorCode: 'exception',
      message,
    });
    return result;
  }
};

const loadGame = (): OperationResult<GameState> => {
  try {
    const state = GameRepository.loadGame();
    const result = new OperationResult<GameState>(state);
    result.setSuccess();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<GameState>({} as GameState);
    result.setError({
      errorCode: 'exception',
      message,
    });
    return result;
  }
};

/**
 * Whether a readable save exists. Cheaper than `loadGame().succeeded`, which rebuilds the whole
 * container just to answer a boolean.
 */
const hasSavedGame = (): OperationResult<boolean> => {
  try {
    const result = new OperationResult<boolean>(GameRepository.hasSavedGame());
    result.setSuccess();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const result = new OperationResult<boolean>(false);
    result.setError({
      errorCode: 'exception',
      message,
    });
    return result;
  }
};

export default {
  hasSavedGame,
  loadGame,
  saveGame,
};
