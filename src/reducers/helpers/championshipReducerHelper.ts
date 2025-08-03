import { BaseTeam, Match, TableStanding } from '../../types';
import { ChampionshipConfig } from '../../types';

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

// Helper function to update team morale and player strength
export function updateTeamMoraleAndStrength(teams: BaseTeam[], matches: Match[]): BaseTeam[] {
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

export function addOrUpdateOtherChampionship(
  otherChampionships: ChampionshipConfig[],
  teamToAddOrUpdate: ChampionshipConfig
): ChampionshipConfig[] {
  const existingIndex = otherChampionships.findIndex(
    (champ) => champ.internalName === teamToAddOrUpdate.internalName
  );

  if (existingIndex >= 0) {
    return otherChampionships.map((champ, index) =>
      index === existingIndex ? teamToAddOrUpdate : champ
    );
  }

  return [...otherChampionships, teamToAddOrUpdate];
}
