import { GameState } from '../game-engine/game-state';

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
}
