import { BaseTeam, Match, TableStanding, ChampionshipConfig, Player } from '../../types';
import utils from '../../utils/utils';
import { PlayerStrengthUpdate, MoraleType, TeamMatchResult, ChampionshipState } from '../types';

function getTeamMoraleType(morale: number): MoraleType {
  if (morale <= 35) return 'bad';
  if (morale > 65) return 'good';
  return 'neutral';
}

function getUpdatedTeamMorale(team: BaseTeam, result: TeamMatchResult): number {
  const defaultMorale = 50;
  const moraleType = getTeamMoraleType(team.morale);

  let morale = 0;
  switch (result) {
    case 'win':
      if (moraleType === 'bad') morale = team.morale + 10;
      if (moraleType === 'neutral' || moraleType === 'good') morale = team.morale + 5;
      break;
    case 'draw':
      if (moraleType === 'bad') morale = team.morale - 2;
      if (moraleType === 'neutral' || moraleType === 'good') morale = team.morale + 2;
      break;
    case 'loss':
      if (moraleType === 'bad' || moraleType === 'neutral') morale = team.morale - 5;
      if (moraleType === 'good') morale = team.morale - 10;
      break;
    default:
      morale = defaultMorale;
      break;
  }

  if (morale < 0) return 0;
  if (morale > 100) return 100;

  return morale;
}

function getPlayersToUpdate(
  teamPlayers: number,
  moraleType: MoraleType,
  result: TeamMatchResult
): PlayerStrengthUpdate {
  let strengthChange = 0;

  switch (result) {
    case 'win':
      strengthChange = 1;

      switch (moraleType) {
        case 'bad':
          return {
            numberOfPlayers: utils.getRandomNumberIntoRange(1, 3, teamPlayers),
            strengthChange,
          };
        case 'neutral':
          return {
            numberOfPlayers: utils.getRandomNumberIntoRange(3, 5, teamPlayers),
            strengthChange,
          };
        case 'good':
          return {
            numberOfPlayers: utils.getRandomNumberIntoRange(5, 7, teamPlayers),
            strengthChange,
          };
      }
      break;
    case 'draw':
      switch (moraleType) {
        case 'bad':
          return {
            numberOfPlayers: 1,
            strengthChange: -1,
          };
        case 'good':
          return {
            numberOfPlayers: 1,
            strengthChange: 1,
          };
        case 'neutral':
          return {
            numberOfPlayers: 0,
            strengthChange: 0,
          };
      }
      break;
    case 'loss':
      strengthChange = -1;

      switch (moraleType) {
        case 'bad':
          return {
            numberOfPlayers: utils.getRandomNumberIntoRange(3, 5, teamPlayers),
            strengthChange: -1,
          };
        case 'neutral':
          return {
            numberOfPlayers: utils.getRandomNumberIntoRange(1, 3, teamPlayers),
            strengthChange: -1,
          };
        case 'good':
          return {
            numberOfPlayers: 1,
            strengthChange: -1,
          };
      }
      break;
  }
}

function getPlayersWithUpdatedStrength(
  playersToUpdate: PlayerStrengthUpdate,
  team: BaseTeam
): Player[] {
  if (playersToUpdate.numberOfPlayers <= 0) return team.players;

  if ((team.players?.length || 0) === 0) return [];

  // Create a copy of the players array to avoid mutating the original
  const players = [...team.players];
  const updatedIndices = new Set<number>();
  let updatesRemaining = Math.min(playersToUpdate.numberOfPlayers, players.length);

  // Select and update random players
  while (updatesRemaining > 0 && updatedIndices.size < players.length) {
    const randomIndex = Math.floor(Math.random() * players.length);

    // Skip if we've already updated this player
    if (updatedIndices.has(randomIndex)) continue;

    const player = players[randomIndex];

    // Update player strength, ensuring it stays within 1-100 range
    if (player.strength !== undefined) {
      player.strength = Math.max(
        1,
        Math.min(100, (player.strength || 50) + playersToUpdate.strengthChange)
      );
      updatedIndices.add(randomIndex);
      updatesRemaining--;
    }
  }

  // Update the team with the modified players
  return players;
}

function updatePlayersStrength(team: BaseTeam, result: TeamMatchResult): Player[] {
  const moraleType = getTeamMoraleType(team.morale);
  const playersToUpdate = getPlayersToUpdate(team.players.length, moraleType, result);

  return getPlayersWithUpdatedStrength(playersToUpdate, team);
}

function getTeamResults(matches: Match[]): Map<string, TeamMatchResult> {
  const teamResults = new Map<string, TeamMatchResult>();
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

  return teamResults;
}

function updateGroupStandings(state: ChampionshipState, matches: Match[]) {
  const updatedGroupStandings = state.groupStandings.map((group) => {
    const groupTeamIds = new Set(group.tableStandings.map((standing) => standing.teamId));
    const groupMatches = matches.filter(
      (match) => groupTeamIds.has(match.homeTeam.id) || groupTeamIds.has(match.visitorTeam.id)
    );

    return {
      ...group,
      tableStandings: calculateUpdatedStandings(group.tableStandings, groupMatches),
    };
  });

  return {
    ...state,
    groupStandings: updatedGroupStandings,
  };
}

export function calculateUpdatedStandings(
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

export function updateTeamMoraleAndStrength(teams: BaseTeam[], matches: Match[]): BaseTeam[] {
  const teamResults = getTeamResults(matches);

  return teams.map((team) => {
    const result = teamResults.get(team.id);
    if (!result) return team; // Team not in any matches

    const updatedTeam = JSON.parse(JSON.stringify(team)) as BaseTeam;
    updatedTeam.morale = getUpdatedTeamMorale(updatedTeam, result);
    updatedTeam.players = updatePlayersStrength(updatedTeam, result);

    return updatedTeam;
  });
}

export function addOrUpdateOtherChampionship(
  otherChampionships: ChampionshipConfig[],
  updatedChampionship: ChampionshipConfig
): ChampionshipConfig[] {
  const existingIndex = otherChampionships.findIndex(
    (champ) => champ.internalName === updatedChampionship.internalName
  );

  if (existingIndex >= 0) {
    return otherChampionships.map((champ, index) =>
      index === existingIndex ? updatedChampionship : champ
    );
  }

  return [...otherChampionships, updatedChampionship];
}

export function updateTableStandings(state: ChampionshipState, matches: Match[]) {
  if (state.groupStandings.length > 0) {
    return updateGroupStandings(state, matches);
  }

  return {
    ...state,
    tableStandings: calculateUpdatedStandings(state.tableStandings, matches),
  };
}
