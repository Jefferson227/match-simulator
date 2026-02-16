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

  private startRound(championship: Championship): Championship {
    if (!championship?.matchContainer?.rounds) {
      throw new Error("Championship couldn't be found.");
    }

    const matchContainer = championship.matchContainer;
    const rounds = matchContainer.rounds;

    let roundIndex = -1;
    for (let i = 0; i < rounds.length; i++) {
      if (rounds[i].number === matchContainer.currentRound) {
        roundIndex = i;
        break;
      }
    }

    if (roundIndex === -1) {
      throw new Error("Championship couldn't be found.");
    }

    const round = rounds[roundIndex];
    const currentMatches = round.matches;
    const updatedMatches = currentMatches.slice();
    let hasMatchChanges = false;

    for (let i = 0; i < currentMatches.length; i++) {
      const match = currentMatches[i];
      if (match.homeTeamScore !== 0 || match.awayTeamScore !== 0 || match.scorers.length > 0) {
        updatedMatches[i] = {
          ...match,
          homeTeamScore: 0,
          awayTeamScore: 0,
          scorers: [],
        };
        hasMatchChanges = true;
      }
    }

    if (!hasMatchChanges && round.status === 'in-progress') return championship;

    const updatedRounds = rounds.slice();
    updatedRounds[roundIndex] = {
      ...round,
      matches: hasMatchChanges ? updatedMatches : currentMatches,
      status: 'in-progress',
    };

    return {
      ...championship,
      matchContainer: {
        ...matchContainer,
        rounds: updatedRounds,
      },
    };
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
    try {
      let updatedChampionshipContainer = { ...this.state.championshipContainer };

      const updatedPlayableChampionship = this.startRound(
        this.state.championshipContainer.playableChampionship
      );
      updatedChampionshipContainer = {
        ...updatedChampionshipContainer,
        playableChampionship: updatedPlayableChampionship,
      };

      let updatedPromotionChampionship: Championship | undefined;
      if (this.state.championshipContainer.playableChampionship.isPromotable) {
        updatedPromotionChampionship = this.startRound(
          this.state.championshipContainer.promotionChampionship!
        );

        updatedChampionshipContainer = {
          ...updatedChampionshipContainer,
          promotionChampionship: updatedPromotionChampionship,
        };
      }

      let updatedRelegationChampionship: Championship | undefined;
      if (this.state.championshipContainer.playableChampionship.isRelegatable) {
        updatedRelegationChampionship = this.startRound(
          this.state.championshipContainer.promotionChampionship!
        );

        updatedChampionshipContainer = {
          ...updatedChampionshipContainer,
          relegationChampionship: updatedRelegationChampionship,
        };
      }

      return {
        ...this.state,
        championshipContainer: updatedChampionshipContainer,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        ...this.state,
        hasError: true,
        errorMessage,
      };
    }
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
