import { BaseTeam, SeasonRound, TableStanding, Match, ChampionshipConfig } from '../types';
import { ChampionshipState } from './types/ChampionshipState';

// Championship action types
export type ChampionshipAction =
  | { type: 'SET_CHAMPIONSHIP'; payload: ChampionshipConfig }
  | { type: 'SET_HUMAN_PLAYER_BASE_TEAM'; payload: BaseTeam }
  | { type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY'; payload: BaseTeam[] }
  | { type: 'SET_SEASON_MATCH_CALENDAR'; payload: SeasonRound[] }
  | { type: 'SET_CURRENT_ROUND'; payload: number }
  | { type: 'INCREMENT_CURRENT_ROUND' }
  | { type: 'UPDATE_TABLE_STANDINGS'; payload: Match[] }
  | { type: 'RESET_TABLE_STANDINGS' }
  | { type: 'GET_TABLE_STANDINGS' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; payload: ChampionshipState }
  | { type: 'SET_YEAR'; payload: number }
  | { type: 'INCREMENT_YEAR' }
  | { type: 'SET_OTHER_CHAMPIONSHIPS'; payload: ChampionshipConfig[] }
  | { type: 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP'; payload: ChampionshipConfig }
  | {
      type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY_FOR_OTHER_CHAMPIONSHIPS';
      payload: ChampionshipConfig[];
    }
  | { type: 'UPDATE_TEAM_MORALE'; payload: Match[] };

// Initial state
export const initialChampionshipState: ChampionshipState = {
  selectedChampionship: null,
  humanPlayerBaseTeam: null,
  teamsControlledAutomatically: [],
  seasonMatchCalendar: [],
  currentRound: 1,
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

// Helper function to update team morale and player strength
function updateTeamMoraleAndStrength(teams: BaseTeam[], matches: Match[]): BaseTeam[] {
  // Create a map of team ID to match results
  const teamResults = new Map<string, 'win' | 'loss' | 'draw'>();

  // Process each match to determine results
  for (const match of matches) {
    const homeScore = match.homeTeam.score || 0;
    const awayScore = match.visitorTeam.score || 0;

    if (homeScore > awayScore) {
      teamResults.set(match.homeTeam.id, 'win');
      teamResults.set(match.visitorTeam.id, 'loss');
    } else if (homeScore < awayScore) {
      teamResults.set(match.homeTeam.id, 'loss');
      teamResults.set(match.visitorTeam.id, 'win');
    } else {
      teamResults.set(match.homeTeam.id, 'draw');
      teamResults.set(match.visitorTeam.id, 'draw');
    }
  }

  // Update each team's morale and player strength
  return teams.map((team) => {
    const result = teamResults.get(team.id);
    if (!result) return team; // Team not in any matches

    // Create a deep copy of the team to avoid mutating the original
    const updatedTeam = JSON.parse(JSON.stringify(team)) as BaseTeam;

    // Update team morale based on match result
    if (result === 'win') {
      updatedTeam.morale = Math.min(100, (updatedTeam.morale || 50) + 10);
    } else if (result === 'loss') {
      updatedTeam.morale = Math.max(0, (updatedTeam.morale || 50) - 10);
    } else {
      // draw
      updatedTeam.morale = Math.min(100, (updatedTeam.morale || 50) + 5);
    }

    // Update player strength based on morale
    if (updatedTeam.players && updatedTeam.players.length > 0) {
      const morale = updatedTeam.morale || 50;
      let playersToUpdate = 0;
      let strengthChange = 0;

      if (morale <= 35) {
        // Decrease strength for 3-5 random players
        playersToUpdate = Math.min(updatedTeam.players.length, Math.floor(Math.random() * 3) + 3);
        strengthChange = -1;
      } else if (morale > 65) {
        // Increase strength for 3-5 random players
        playersToUpdate = Math.min(updatedTeam.players.length, Math.floor(Math.random() * 3) + 3);
        strengthChange = 1;
      }

      if (playersToUpdate > 0 && updatedTeam.players && updatedTeam.players.length > 0) {
        // Create a copy of the players array to avoid mutating the original
        const players = [...updatedTeam.players];
        const updatedIndices = new Set<number>();
        let updatesRemaining = Math.min(playersToUpdate, players.length);

        // Select and update random players
        while (updatesRemaining > 0 && updatedIndices.size < players.length) {
          const randomIndex = Math.floor(Math.random() * players.length);

          // Skip if we've already updated this player
          if (updatedIndices.has(randomIndex)) continue;

          const player = players[randomIndex];

          // Update player strength, ensuring it stays within 1-100 range
          if (player.strength !== undefined) {
            player.strength = Math.max(1, Math.min(100, (player.strength || 50) + strengthChange));
            updatedIndices.add(randomIndex);
            updatesRemaining--;
          }
        }

        // Update the team with the modified players
        updatedTeam.players = players;
      }
    }

    return updatedTeam;
  });
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
        : null;

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
    default:
      return state;
  }
};
