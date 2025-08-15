export interface TeamStanding {
  teamId: string;
  teamAbbreviation: string;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
}

export interface TeamStandingsProps {
  standings?: TeamStanding[];
}

export interface TopScorer {
  playerName: string;
  teamAbbreviation: string;
  goals: number;
  position: number;
}
