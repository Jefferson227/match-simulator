import {
  addOrUpdateOtherChampionship,
  calculateUpdatedStandings,
  updateTeamMoraleAndStrength,
} from './helpers/championshipReducerHelper';
import { ChampionshipAction, ChampionshipState } from './types';
import { BaseTeam } from '../types';

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: {} as BaseTeam,
  teamsControlledAutomatically: [],
  seasonMatchCalendar: [],
  currentRound: 1,
  tableStandings: [],
  year: 0,
  otherChampionships: [],
};

// Championship reducer
export const championshipReducer = (
  state: ChampionshipState,
  action: ChampionshipAction
): ChampionshipState => {
  switch (action.type) {
    case 'SET_CHAMPIONSHIP':
      return {
        ...state,
        championshipConfigId: action.payload.id,
        name: action.payload.name,
        selectedChampionship: action.payload.internalName,
        promotionChampionship: action.payload.promotionChampionship,
        relegationChampionship: action.payload.relegationChampionship,
        promotionTeams: action.payload.promotionTeams,
        relegationTeams: action.payload.relegationTeams,
      };
    case 'SET_HUMAN_PLAYER_BASE_TEAM':
      return {
        ...state,
        humanPlayerBaseTeam: action.payload,
      };
    case 'SET_TEAMS_CONTROLLED_AUTOMATICALLY':
      return {
        ...state,
        teamsControlledAutomatically: action.payload,
      };
    case 'SET_SEASON_MATCH_CALENDAR':
      return {
        ...state,
        seasonMatchCalendar: action.payload,
      };
    case 'SET_CURRENT_ROUND':
      return {
        ...state,
        currentRound: action.payload,
      };
    case 'INCREMENT_CURRENT_ROUND':
      return {
        ...state,
        currentRound: state.currentRound + 1,
      };
    case 'UPDATE_TABLE_STANDINGS':
      return {
        ...state,
        tableStandings: calculateUpdatedStandings(state.tableStandings, action.payload),
      };
    case 'RESET_TABLE_STANDINGS':
      return {
        ...state,
        tableStandings: [],
      };
    case 'GET_TABLE_STANDINGS':
      return state;
    case 'RESET':
      return initialChampionshipState;
    case 'LOAD_STATE':
      return action.payload;
    case 'SET_YEAR':
      return {
        ...state,
        year: action.payload,
      };
    case 'INCREMENT_YEAR':
      return {
        ...state,
        year: state.year + 1,
      };
    case 'SET_OTHER_CHAMPIONSHIPS':
      return {
        ...state,
        otherChampionships: action.payload,
      };
    case 'UPDATE_TEAM_MORALE':
      // Update morale for both human-controlled and AI-controlled teams
      const updatedHumanTeam = state.humanPlayerBaseTeam
        ? updateTeamMoraleAndStrength([state.humanPlayerBaseTeam], action.payload)[0]
        : ({} as BaseTeam);

      const updatedAITeams = updateTeamMoraleAndStrength(
        state.teamsControlledAutomatically,
        action.payload
      );

      return {
        ...state,
        humanPlayerBaseTeam: updatedHumanTeam,
        teamsControlledAutomatically: updatedAITeams,
      };

    case 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP':
      return {
        ...state,
        otherChampionships: (() => {
          const existingIndex = state.otherChampionships.findIndex(
            (champ) => champ.internalName === action.payload.internalName
          );

          if (existingIndex >= 0) {
            // Update existing championship
            return state.otherChampionships.map((champ, index) =>
              index === existingIndex ? action.payload : champ
            );
          } else {
            // Add new championship
            return [...state.otherChampionships, action.payload];
          }
        })(),
      };
    case 'SET_TEAMS_CONTROLLED_AUTOMATICALLY_FOR_OTHER_CHAMPIONSHIPS':
      return {
        ...state,
        otherChampionships: action.payload,
      };
    case 'UPDATE_CHAMPIONSHIP_STATE':
      let otherChampionships = [...state.otherChampionships];
      if (action.payload.newPromotionChampionshipConfig) {
        otherChampionships = addOrUpdateOtherChampionship(
          otherChampionships,
          action.payload.newPromotionChampionshipConfig
        );
      }

      if (action.payload.newRelegationChampionshipConfig) {
        otherChampionships = addOrUpdateOtherChampionship(
          otherChampionships,
          action.payload.newRelegationChampionshipConfig
        );
      }

      if (action.payload.previousChampionship) {
        otherChampionships = addOrUpdateOtherChampionship(
          otherChampionships,
          action.payload.previousChampionship
        );
      }

      return {
        ...state,
        otherChampionships,
        name: action.payload.newChampionshipFullName,
        promotionChampionship: action.payload.newPromotionChampionshipName,
        relegationChampionship: action.payload.newRelegationChampionshipName,
        promotionTeams: action.payload.newPromotionTeams,
        relegationTeams: action.payload.newRelegationTeams,
        selectedChampionship: action.payload.newSelectedChampionship
          ? action.payload.newSelectedChampionship
          : state.selectedChampionship,
        seasonMatchCalendar: action.payload.seasonCalendar,
      };
    default:
      return state;
  }
};
