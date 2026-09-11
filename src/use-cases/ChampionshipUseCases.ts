import { Championship } from '../domain/models/Championship';
import Match from '../domain/models/Match';
import { Team } from '../domain/models/Team';
import ChampionshipService from '../domain/services/ChampionshipService';
import TeamService from '../domain/services/TeamService';
import { GameState } from '../game-engine/GameState';
import LeagueType from '../domain/enums/LeagueType';
import { PhaseView } from '../domain/features/phases/PhaseView';
import { RandomProvider } from '../domain/features/match-simulation/types';
import { ENTRY_CHAMPIONSHIP_BY_LEAGUE_TYPE } from '../domain/constants/EntryChampionships';

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

  /**
   * Starts a new game: initialises the entry division for the league type, draws the human's club
   * from it and hands the club to the human, the same way SELECT_TEAM does.
   */
  drawTeamForHumanPlayer(dependencies?: { rng?: RandomProvider }): GameState {
    const internalName = ENTRY_CHAMPIONSHIP_BY_LEAGUE_TYPE[this.state.leagueType];
    if (!internalName) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: `No entry championship for league type "${this.state.leagueType}".`,
      };
    }

    const initResult = ChampionshipService.initChampionships(internalName);
    if (!initResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: initResult.error.message,
      };
    }

    const container = initResult.getResult();
    const drawResult = ChampionshipService.drawTeamForHumanPlayer(
      container.playableChampionship,
      dependencies
    );
    if (!drawResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: drawResult.error.message,
      };
    }

    const selectResult = TeamService.selectTeam(
      container.playableChampionship,
      drawResult.getResult().id
    );
    if (!selectResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: selectResult.error.message,
      };
    }

    return {
      ...this.state,
      gameConfig: {
        clockSpeed: 250,
      },
      championshipContainer: {
        ...container,
        playableChampionship: selectResult.getResult(),
      },
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
