import { GameState } from '../game-engine/GameState';
import MatchService from '../domain/services/MatchService';

export default class MatchUseCases {
  private state = {} as GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  runMatchActions(): GameState {
    const result = MatchService.runMatchActions(this.state.championshipContainer);
    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return {
      ...this.state,
      championshipContainer: result.getResult(),
    };
  }
}
