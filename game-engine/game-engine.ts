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
        const subIds = action.starters.map((sub) => sub.id);
        const team = state.championshipContainer.playableChampionship.teams.find(
          (team) => team.id === action.team.id
        );
        if (!team) {
          return {
            ...state,
            hasError: true,
            errorMessage: 'Team not found while setting starters and subs.',
          };
        }

        const updatedPlayers = team.players.map((player) => {
          if (starterIds.includes(player.id))
            return {
              ...player,
              isStarter: true,
            };

          if (subIds.includes(player.id))
            return {
              ...player,
              isSub: true,
            };

          return player;
        });
        const updatedTeam = {
          ...team,
          players: updatedPlayers,
        };

        // TODO: Update the team into the state.championshipContainer.playableChampionship
        return state;
      case 'START_MATCHES':
        console.log('pong');
        return state;
      case 'PING':
        console.log('pong');
        return state;

      default:
        return state;
    }
  }
}
