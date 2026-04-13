import { GameState } from '../game-engine/GameState';
import GameService from '../domain/services/GameService';

export default class GameUseCases {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  setErrorMessage(errorMessage: string): GameState {
    return {
      ...this.state,
      hasError: true,
      errorMessage,
    };
  }

  setCurrentScreen(screenName: string): GameState {
    return {
      ...this.state,
      currentScreen: screenName,
    };
  }

  updateClockSpeed(speed: number): GameState {
    return {
      ...this.state,
      gameConfig: {
        ...this.state.gameConfig,
        clockSpeed: speed,
      },
    };
  }

  saveGame(): GameState {
    const result = GameService.saveGame(this.state);
    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return this.state;
  }

  loadGame(): GameState {
    const result = GameService.loadGame();
    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return result.getResult();
  }
}
