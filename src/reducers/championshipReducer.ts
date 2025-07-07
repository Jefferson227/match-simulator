import {
  BaseTeam,
  SeasonRound,
  TableStanding,
  Match,
  ChampionshipConfig,
} from '../types';

// Championship state interface
export interface ChampionshipState {
  selectedChampionship: string | null;
  humanPlayerBaseTeam: BaseTeam | null;
  teamsControlledAutomatically: BaseTeam[];
  seasonMatchCalendar: SeasonRound[];
  currentRound: number;
  tableStandings: TableStanding[];
  year: number;
  otherChampionships: ChampionshipConfig[];
}

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: string }
  | { type: 'SET_HUMAN_PLAYER_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY'; payload: BaseTeam[] }
  | { type: 'SET_SEASON_MATCH_CALENDAR'; payload: SeasonRound[] }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'INCREMENT_CURRENT_ROUND' }
  | { type: 'UPDATE_TABLE_STANDINGS'; payload: Match[] }
  | { type: 'GET_TABLE_STANDINGS' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; payload: ChampionshipState }
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'INCREMENT_YEAR' }
  | { type: 'SET_OTHER_CHAMPIONSHIPS'; payload: ChampionshipConfig[] };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: null,
  teamsControlledAutomatically: [],
  seasonMatchCalendar: [],
  currentRound: 0,
  tableStandings: [],
  year: 0,
  otherChampionships: [],
};

function calculateUpdatedStandings(
  prevStandings: TableStanding[] = [],
  matches: Match[]
): TableStanding[] {
  // Create a map for quick lookup
  const standingsMap = new Map<string, TableStanding>();
  prevStandings.forEach((standing) => {
    standingsMap.set(standing.teamId, { ...standing });
  });

  // Helper to get or create a standing
  function getOrCreate(team: Match['homeTeam'] | Match['visitorTeam']) {
    if (!standingsMap.has(team.id)) {
      standingsMap.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        teamAbbreviation: team.abbreviation || team.name,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
    return standingsMap.get(team.id)!;
  }

  for (const match of matches) {
    const home = getOrCreate(match.homeTeam);
    const away = getOrCreate(match.visitorTeam);
    const homeGoals = match.homeTeam.score || 0;
    const awayGoals = match.visitorTeam.score || 0;

    // Update goals for/against
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

    // Win/draw/loss/points
    if (homeGoals > awayGoals) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeGoals < awayGoals) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  // Update goal difference
  for (const standing of standingsMap.values()) {
    standing.goalDifference = standing.goalsFor - standing.goalsAgainst;
  }

  // Return sorted standings
  return Array.from(standingsMap.values()).sort(
    (a, b) => b.points - a.points || b.goalDifference - a.goalDifference
  );
}

// Championship reducer
export const championshipReducer = (
  state: ChampionshipState,
  action: ChampionshipAction
): ChampionshipState => {
  switch (action.type) {
    case 'SET_CHAMPIONSHIP':
      return {
        ...state,
        selectedChampionship: action.payload,
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
        tableStandings: calculateUpdatedStandings(
          state.tableStandings,
          action.payload
        ),
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
    default:
      return state;
  }
};
