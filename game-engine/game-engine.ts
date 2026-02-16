import { GameAction, GameState } from './game-state';
import { initChampionships } from '../use-cases/ChampionshipUseCases';
import * as TeamUseCases from '../use-cases/TeamUseCases';
import * as Utils from './Utils';
import { Team } from '../core/models/Team';
import { Championship } from '../core/models/Championship';

type Listener = () => void;

export class GameEngine {
  private state: GameState;
  private listeners = new Set<Listener>();

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  // This approach can cause unnecessary re-renders on React, since it will notify
  // React right after every change in the state.
  // In the future, consider using a library for that like Zustand or any other.
  dispatch(action: GameAction) {
    this.state = this.reduce(this.state, action);
    this.emit();
  }

  private reduce(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'INIT_CHAMPIONSHIPS':
        const result = initChampionships(action.championshipInternalName);
        if (!result.succeeded) {
          return {
            ...state,
            hasError: true,
            errorMessage: result.error.message,
          };
        }

        return {
          ...state,
          gameConfig: {
            clockSpeed: 250,
          },
          championshipContainer: result.getResult(),
        };
      case 'SET_ERROR_MESSAGE':
        return {
          ...state,
          hasError: true,
          errorMessage: action.errorMessage,
        };
      case 'SET_CURRENT_SCREEN':
        return {
          ...state,
          currentScreen: action.screenName,
        };
      case 'SELECT_TEAM':
        const selectTeamResult = TeamUseCases.selectTeam(
          state.championshipContainer.playableChampionship,
          action.teamId
        );

        if (!selectTeamResult.succeeded) {
          return {
            ...state,
            hasError: true,
            errorMessage: selectTeamResult.error.message,
          };
        }

        return {
          ...state,
          championshipContainer: {
            ...state.championshipContainer,
            playableChampionship: selectTeamResult.getResult(),
          },
        };
      case 'SET_STARTERS_AND_SUBS':
        const starterIds = action.starters.map((starter) => starter.id);
        const subIds = action.subs.map((sub) => sub.id);
        const teams = state.championshipContainer.playableChampionship.teams;

        let teamIndex = -1;
        for (let i = 0; i < teams.length; i++) {
          if (teams[i].id === action.team.id) {
            teamIndex = i;
            break;
          }
        }
        if (teamIndex === -1) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Team not found while setting starters and subs.',
          };
        }

        const team = teams[teamIndex];
        const updatedPlayers = team.players.map((player) => {
          if (starterIds.includes(player.id))
            return {
              ...player,
              isStarter: true,
              isSub: false,
            };

          if (subIds.includes(player.id))
            return {
              ...player,
              isStarter: false,
              isSub: true,
            };

          return {
            ...player,
            isStarter: false,
            isSub: false,
          };
        });
        const updatedTeam = {
          ...team,
          players: updatedPlayers,
        };

        const updatedTeams = teams.slice();
        updatedTeams[teamIndex] = updatedTeam;

        return {
          ...state,
          championshipContainer: {
            ...state.championshipContainer,
            playableChampionship: {
              ...state.championshipContainer.playableChampionship,
              teams: updatedTeams,
            },
          },
        };
      case 'START_ROUND_FOR_ALL_CHAMPIONSHIPS':
        try {
          let updatedChampionshipContainer = { ...state.championshipContainer };

          const updatedPlayableChampionship = Utils.startRound(
            state.championshipContainer.playableChampionship
          );
          updatedChampionshipContainer = {
            ...updatedChampionshipContainer,
            playableChampionship: updatedPlayableChampionship,
          };

          let updatedPromotionChampionship: Championship | undefined;
          if (state.championshipContainer.playableChampionship.isPromotable) {
            updatedPromotionChampionship = Utils.startRound(
              state.championshipContainer.promotionChampionship!
            );

            updatedChampionshipContainer = {
              ...updatedChampionshipContainer,
              promotionChampionship: updatedPromotionChampionship,
            };
          }

          let updatedRelegationChampionship: Championship | undefined;
          if (state.championshipContainer.playableChampionship.isRelegatable) {
            updatedRelegationChampionship = Utils.startRound(
              state.championshipContainer.promotionChampionship!
            );

            updatedChampionshipContainer = {
              ...updatedChampionshipContainer,
              relegationChampionship: updatedRelegationChampionship,
            };
          }

          return {
            ...state,
            championshipContainer: updatedChampionshipContainer,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            ...state,
            hasError: true,
            errorMessage,
          };
        }
      case 'END_ROUND_FOR_ALL_CHAMPIONSHIPS':
        // TODO: Implement logic to end the rounds for all championships (playableChampionship, relegationChampionship, promotionChampionship)
        // - For each championship:
        //  - Get the current round
        //  - Set the current round status as 'finished'
        //  - Increase the number of the round by +1
        console.log('Round ended.');
        return state;
      case 'SUBSTITUTE_PLAYER':
        const matches = Utils.getMatchesFromCurrentRound(state);
        if (!matches) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Match could not be found to confirm substitution.',
          };
        }

        const match = matches.find((match) => match.id === action.matchId);
        if (!match) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Match could not be found to confirm substitution.',
          };
        }

        let teamToUpdate: Team | undefined;
        if (match.homeTeam.id === action.team.id) teamToUpdate = match.homeTeam;
        if (match.awayTeam.id === action.team.id) teamToUpdate = match.awayTeam;

        if (!teamToUpdate) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Team could not be found to confirm substitution.',
          };
        }

        const updatedTeamForSubstitution = {
          ...teamToUpdate,
          players: teamToUpdate.players.map((player) => {
            if (player.id === action.player.id) {
              return { ...player, isStarter: false, isSub: false };
            }

            if (player.id === action.sub.id) {
              return { ...player, isStarter: true, isSub: false };
            }

            return player;
          }),
        };

        const updatedMatch =
          match.homeTeam.id === updatedTeamForSubstitution.id
            ? { ...match, homeTeam: updatedTeamForSubstitution }
            : { ...match, awayTeam: updatedTeamForSubstitution };

        const playableChampionship = state.championshipContainer.playableChampionship;
        const matchContainer = playableChampionship.matchContainer;

        let roundIndex = -1;
        for (let i = 0; i < matchContainer.rounds.length; i++) {
          if (matchContainer.rounds[i].number === matchContainer.currentRound) {
            roundIndex = i;
            break;
          }
        }

        if (roundIndex === -1) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Round could not be found to confirm substitution.',
          };
        }

        const round = matchContainer.rounds[roundIndex];
        const matchIndex = round.matches.findIndex(
          (currentMatch) => currentMatch.id === action.matchId
        );
        if (matchIndex === -1) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Match could not be found to confirm substitution.',
          };
        }

        const updatedMatches = round.matches.slice();
        updatedMatches[matchIndex] = updatedMatch;

        const updatedRounds = matchContainer.rounds.slice();
        updatedRounds[roundIndex] = {
          ...round,
          matches: updatedMatches,
        };

        return {
          ...state,
          championshipContainer: {
            ...state.championshipContainer,
            playableChampionship: {
              ...playableChampionship,
              matchContainer: {
                ...matchContainer,
                rounds: updatedRounds,
              },
            },
          },
        };
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
