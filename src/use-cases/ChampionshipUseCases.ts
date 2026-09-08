import { Championship } from '../domain/models/Championship';
import Match from '../domain/models/Match';
import { Team } from '../domain/models/Team';
import ChampionshipService from '../domain/services/ChampionshipService';
import { GameState } from '../game-engine/GameState';
import LeagueType from '../domain/enums/LeagueType';
import { PhaseView } from '../domain/features/phases/PhaseView';

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

  startRoundForAllChampionships(): GameState {
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

  endRoundForAllChampionships(): GameState {
    const result = ChampionshipService.endRoundForAllChampionships(
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

  runEndOfChampionshipActions(): GameState {
    const result = ChampionshipService.runEndOfChampionshipActions(
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

  getChampionships(leagueType?: LeagueType): Championship[] {
    const result = ChampionshipService.getChampionships(leagueType);
    if (!result.succeeded) {
      throw new Error('List of championships could not be found.');
    }

    return result.getResult();
  }

  setLeagueType(leagueType: LeagueType): GameState {
    return {
      ...this.state,
      leagueType,
    };
  }

  getTeamControlledByHuman(championship: Championship): Team {
    const result = ChampionshipService.getTeamControlledByHuman(championship);
    if (!result.succeeded) {
      throw new Error('Team controlled by human player could not be found.');
    }

    return result.getResult();
  }

  /** The phase a championship is currently playing, for the screens. Never throws. */
  getPhaseView(championship: Championship): PhaseView {
    return ChampionshipService.getPhaseView(championship);
  }

  getMatchesForCurrentRound(championship: Championship): Match[] {
    const result = ChampionshipService.getMatchesForCurrentRound(championship);
    if (!result.succeeded) {
      throw new Error('Team controlled by human player could not be found.');
    }

    return result.getResult();
  }
}
