export interface TeamStanding {
  team: string;
  position: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export interface StandingsState {
  standings: TeamStanding[];
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}
