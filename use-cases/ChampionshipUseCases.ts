import { Championship } from '../core/models/Championship';
import Match from '../core/models/Match';
import { Team } from '../core/models/Team';
import OperationResult from '../core/results/OperationResult';
import ChampionshipService from '../core/services/ChampionshipService';
import { GameState } from '../game-engine/game-state';

export default class ChampionshipUseCases {
  private state = {} as GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  initChampionships(championshipInternalName: string): GameState {
    const result = ChampionshipService.initChampionships(championshipInternalName);
    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return {
      ...this.state,
      gameConfig: {
        clockSpeed: 250,
      },
      championshipContainer: result.getResult(),
    };
  }

  startRoundForAllChampionships() {
    const result = ChampionshipService.startRoundForAllChampionships(
      this.state.championshipContainer
    );
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

export function getChampionships(): OperationResult<Championship[]> {
  return ChampionshipService.getChampionships();
}

export function getTeamControlledByHuman(championship: Championship): OperationResult<Team> {
  return ChampionshipService.getTeamControlledByHuman(championship);
}

export function getMatchesForCurrentRound(championship: Championship): OperationResult<Match[]> {
  return ChampionshipService.getMatchesForCurrentRound(championship);
}
