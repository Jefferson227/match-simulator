import { ChampionshipState } from '../../reducers/types/ChampionshipState';

function getTeamsByPerformance(
  championship: ChampionshipConfig,
  type: 'promotion' | 'relegation'
): BaseTeam[] {
  const teams: BaseTeam[] = championship.teamsControlledAutomatically || [];
  const teamCount =
    type === 'promotion' ? championship.promotionTeams : championship.relegationTeams;

  if (teams.length === 0 || !teamCount) return [];

  // Initialize win counters
  const winCounts: Record<string, number> = {};
  teams.forEach((team) => {
    winCounts[team.abbreviation] = 0;
  });

  // Each team plays every other team twice
  for (let i = 0; i < teams.length; i++) {
    for (let j = 0; j < teams.length; j++) {
      if (i === j) continue;
      const teamA = teams[i];
      const teamB = teams[j];

      // Calculate average strength for each team from all players
      const teamAAverageStrength =
        teamA.players.length > 0
          ? teamA.players.reduce((sum, player) => sum + player.strength, 0) / teamA.players.length
          : 0;
      const teamBAverageStrength =
        teamB.players.length > 0
          ? teamB.players.reduce((sum, player) => sum + player.strength, 0) / teamB.players.length
          : 0;

      // Play two matches (home and away)
      for (let match = 0; match < 2; match++) {
        let winner: BaseTeam | null = null;
        while (!winner) {
          const scoreA = Math.floor(Math.random() * (teamAAverageStrength + 1));
          const scoreB = Math.floor(Math.random() * (teamBAverageStrength + 1));
          if (scoreA > scoreB) {
            winner = teamA;
          } else if (scoreB > scoreA) {
            winner = teamB;
          }
          // If tie, repeat
        }
        winCounts[winner.abbreviation] += 1;
      }
    }
  }

  // Sort teams by win count (ascending for relegation, descending for promotion)
  const sortedTeams = [...teams].sort((a, b) => {
    if (type === 'promotion') {
      return winCounts[b.abbreviation] - winCounts[a.abbreviation]; // Most wins first
    } else {
      return winCounts[a.abbreviation] - winCounts[b.abbreviation]; // Fewest wins first
    }
  });

  // Return the appropriate number of teams
  return sortedTeams.slice(0, teamCount);
}
export const hasPromotionChampionship = (championship: ChampionshipState): boolean => {
  return championship.promotionChampionship !== undefined;
};

export const hasRelegationChampionship = (championship: ChampionshipState): boolean => {
  return championship.relegationChampionship !== undefined;
};

export const movePromotedTeamsToPromotionChampionship = (championship: ChampionshipState) => {
  // getPromotedTeams(championship);
};
