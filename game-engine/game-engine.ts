import { GameAction, GameState } from './game-state';
import { initChampionships } from '../use-cases/ChampionshipUseCases';
import * as TeamUseCases from '../use-cases/TeamUseCases';

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
      case 'START_MATCHES':
        console.log('Starting matches!');
        return state;
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
