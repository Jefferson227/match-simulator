import { Match, SeasonRound, TableStanding, ChampionshipConfig } from '@types';

/**
 * Service for handling championship-related operations
 */
class ChampionshipService {
  /**
   * Calculate updated standings based on match results
   */
  static calculateUpdatedStandings(
    prevStandings: TableStanding[],
    matches: Match[]
  ): TableStanding[] {
    // Create a map for quick lookup
    const standingsMap = new Map<string, TableStanding>();
    
    // Initialize with previous standings
    prevStandings.forEach((standing) => {
      standingsMap.set(standing.teamId, { ...standing });
    });

    // Helper to get or create a standing
    function getOrCreate(team: Match['homeTeam'] | Match['visitorTeam']) {
      if (!standingsMap.has(team.id)) {
        standingsMap.set(team.id, {
          teamId: team.id,
          teamName: team.name,
          teamAbbreviation: team.abbreviation || team.name.substring(0, 3).toUpperCase(),
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

    // Process each match
    for (const match of matches) {
      // Skip matches that haven't been played yet
      if (match.homeTeam.score === undefined || match.visitorTeam.score === undefined) {
        continue;
      }

      const home = getOrCreate(match.homeTeam);
      const away = getOrCreate(match.visitorTeam);
      const homeGoals = match.homeTeam.score || 0;
      const awayGoals = match.visitorTeam.score || 0;

      // Update goals for/against
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      // Update win/draw/loss and points
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

    // Convert map back to array and sort
    return Array.from(standingsMap.values()).sort((a, b) => {
      // Sort by points (desc), then GD (desc), then GF (desc)
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }

  /**
   * Generate a season match calendar (round-robin format)
   */
  static generateSeasonMatchCalendar(teams: string[], rounds: number = 2): SeasonRound[] {
    if (teams.length < 2) return [];
    
    const calendar: SeasonRound[] = [];
    const totalTeams = teams.length;
    const totalRounds = (totalTeams - 1) * rounds;
    const halfTeams = Math.floor(totalTeams / 2);
    
    // Create a copy of the teams array to avoid mutating the original
    let teamList = [...teams];
    
    for (let round = 0; round < totalRounds; round++) {
      const matches: Match[] = [];
      
      // First team stays in place, others rotate clockwise
      for (let i = 0; i < halfTeams; i++) {
        const home = teamList[i];
        const away = teamList[totalTeams - 1 - i];
        
        // Alternate home/away for the return fixture
        if (round % 2 === 1) {
          matches.push({
            homeTeam: { id: away, name: away, score: 0 },
            visitorTeam: { id: home, name: home, score: 0 },
            date: new Date(),
            status: 'scheduled',
          });
        } else {
          matches.push({
            homeTeam: { id: home, name: home, score: 0 },
            visitorTeam: { id: away, name: away, score: 0 },
            date: new Date(),
            status: 'scheduled',
          });
        }
      }
      
      calendar.push({
        round: round + 1,
        matches,
      });
      
      // Rotate all teams except the first one
      teamList = [
        teamList[0],
        teamList[teamList.length - 1],
        ...teamList.slice(1, -1)
      ];
    }
    
    return calendar;
  }

  /**
   * Get the current round based on the current date and match calendar
   */
  static getCurrentRound(calendar: SeasonRound[], currentDate: Date = new Date()): number {
    if (!calendar.length) return 1;
    
    // Find the first round with matches in the future
    for (const round of calendar) {
      const hasFutureMatch = round.matches.some(match => 
        match.date && new Date(match.date) > currentDate
      );
      
      if (hasFutureMatch) {
        return round.round > 1 ? round.round - 1 : 1;
      }
    }
    
    // If all matches are in the past, return the last round
    return calendar[calendar.length - 1].round;
  }

  /**
   * Get the list of teams controlled automatically (all teams except the human player's team)
   */
  static getTeamsControlledAutomatically(
    allTeams: { id: string; name: string }[],
    humanTeamId: string | null
  ) {
    if (!humanTeamId) return [...allTeams];
    return allTeams.filter(team => team.id !== humanTeamId);
  }

  /**
   * Merge championship configurations, updating existing ones and adding new ones
   */
  static mergeChampionshipConfigs(
    currentChampionships: ChampionshipConfig[],
    newChampionships: ChampionshipConfig[]
  ): ChampionshipConfig[] {
    const merged = [...currentChampionships];
    
    for (const newChamp of newChampionships) {
      const existingIndex = merged.findIndex(c => c.id === newChamp.id);
      
      if (existingIndex >= 0) {
        // Update existing championship
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...newChamp,
          // Don't override these properties if they exist in the new championship
          id: merged[existingIndex].id,
          name: merged[existingIndex].name,
        };
      } else {
        // Add new championship
        merged.push(newChamp);
      }
    }
    
    return merged;
  }
}

export default ChampionshipService;
