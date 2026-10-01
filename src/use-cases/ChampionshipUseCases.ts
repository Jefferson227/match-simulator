import { Championship } from '../domain/models/Championship';
import Match from '../domain/models/Match';
import { Team } from '../domain/models/Team';
import ChampionshipService from '../domain/services/ChampionshipService';
import TeamService from '../domain/services/TeamService';
import SeasonAgeingService, { SeasonAgeingOutput } from '../domain/services/SeasonAgeingService';
import { SeasonRetirements } from '../domain/features/retirement/SeasonRetirements';
import { resetSeasonStats } from '../domain/features/player-stats/SeasonStats';
import { GameState } from '../game-engine/GameState';
import LeagueType from '../domain/enums/LeagueType';
import { PhaseView, PhaseViewOptions } from '../domain/features/phases/PhaseView';
import { RandomProvider } from '../domain/features/match-simulation/types';
import { ENTRY_CHAMPIONSHIP_BY_LEAGUE_TYPE } from '../domain/constants/EntryChampionships';
import {
  getChampionshipByInternalName,
  getPlayableChampionship,
  replaceChampionship,
} from '../domain/features/pyramid/Pyramid';

/** A new game starts with no coach pool, no retirees and no retirement report (MS-113). */
const NO_RETIREMENTS: Pick<
  GameState,
  'coachPool' | 'retiredPlayers' | 'retiredCoaches' | 'lastSeasonRetirements'
> = {
  coachPool: [],
  retiredPlayers: [],
  retiredCoaches: [],
  lastSeasonRetirements: undefined,
};

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
      ...NO_RETIREMENTS,
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
    const entryDivision = getPlayableChampionship(container);
    const drawResult = ChampionshipService.drawTeamForHumanPlayer(entryDivision, dependencies);
    if (!drawResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: drawResult.error.message,
      };
    }

    const selectResult = TeamService.selectTeam(entryDivision, drawResult.getResult().id);
    if (!selectResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: selectResult.error.message,
      };
    }

    return {
      ...this.state,
      ...NO_RETIREMENTS,
      gameConfig: {
        clockSpeed: 250,
      },
      championshipContainer: replaceChampionship(container, selectResult.getResult()),
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

  /**
   * Builds the end-of-season report and parks it on the state. Dispatched when the season ends and
   * before `RUN_END_OF_CHAMPIONSHIP_ACTIONS`, which resets the tables it reads.
   */
  buildSeasonSummary(): GameState {
    const result = ChampionshipService.buildSeasonSummary(this.state.championshipContainer);
    if (!result.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: result.error.message,
      };
    }

    return {
      ...this.state,
      seasonSummary: result.getResult(),
    };
  }

  /**
   * Rolls the pyramid over into the next season once the playable division is over. Every player
   * and coach is aged, and retirements rolled, first (MS-113), so the new season's fixtures and
   * tables are built from the aged, replaced squads. Before the season is over, nothing changes.
   */
  runEndOfChampionshipActions(dependencies: { rng?: RandomProvider } = {}): GameState {
    const seasonOverResult = ChampionshipService.isSeasonOver(this.state.championshipContainer);
    if (!seasonOverResult.succeeded) {
      return {
        ...this.state,
        hasError: true,
        errorMessage: seasonOverResult.error.message,
      };
    }

    let ageing: SeasonAgeingOutput | undefined;
    if (seasonOverResult.getResult()) {
      const ageingResult = SeasonAgeingService.runSeasonAgeing(
        {
          championshipContainer: this.state.championshipContainer,
          coachPool: this.state.coachPool,
          retiredPlayers: this.state.retiredPlayers,
          retiredCoaches: this.state.retiredCoaches,
        },
        dependencies
      );
      if (!ageingResult.succeeded) {
        return {
          ...this.state,
          hasError: true,
          errorMessage: ageingResult.error.message,
        };
      }
      ageing = ageingResult.getResult();
    }

    // Season counters start again from 0 after ageing, on the squads ageing just produced.
    const result = ChampionshipService.runEndOfChampionshipActions(
      ageing ? resetSeasonStats(ageing.championshipContainer) : this.state.championshipContainer
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
      ...(ageing && {
        coachPool: ageing.coachPool,
        retiredPlayers: ageing.retiredPlayers,
        retiredCoaches: ageing.retiredCoaches,
        lastSeasonRetirements: ageing.report,
      }),
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

  /**
   * The division the human plays in, for the screens. Before a game is initialised there is none,
   * and an empty championship is returned — the placeholder the initial state used to hold, which
   * every screen already reads defensively. Never throws.
   */
  getPlayableChampionship(): Championship {
    const container = this.state.championshipContainer;
    if (!container?.championships) return {} as Championship;

    return (
      getChampionshipByInternalName(container, container.playableInternalName) ??
      ({} as Championship)
    );
  }

  getTeamControlledByHuman(championship: Championship): Team {
    const result = ChampionshipService.getTeamControlledByHuman(championship);
    if (!result.succeeded) {
      throw new Error('Team controlled by human player could not be found.');
    }

    return result.getResult();
  }

  /**
   * Everyone who retired in `season`, grouped by division, for the Retirements screen. Never
   * throws: a failure reads as a season in which nobody retired.
   */
  getSeasonRetirements(season: number): SeasonRetirements {
    const result = SeasonAgeingService.getSeasonRetirements(
      {
        championshipContainer: this.state.championshipContainer,
        retiredPlayers: this.state.retiredPlayers ?? [],
        retiredCoaches: this.state.retiredCoaches ?? [],
      },
      season
    );
    if (!result.succeeded) {
      return { season, divisions: [], poolCoaches: [], unplaced: { players: [], coaches: [] } };
    }

    return result.getResult();
  }

  /** The phase a championship is playing, for the screens. Never throws. */
  getPhaseView(championship: Championship, options?: PhaseViewOptions): PhaseView {
    return ChampionshipService.getPhaseView(championship, options);
  }

  getMatchesForCurrentRound(championship: Championship): Match[] {
    const result = ChampionshipService.getMatchesForCurrentRound(championship);
    if (!result.succeeded) {
      throw new Error('Team controlled by human player could not be found.');
    }

    return result.getResult();
  }
}
