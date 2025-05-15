export interface Player {
  id: number;
  position: string;
  name: string;
  strength: number;
  fieldPosition?: {
    row: number;
    column: number;
  };
  order?: number;
}

export interface TeamColors {
  outline: string;
  background: string;
  name: string;
}

export interface Team {
  id?: string;
  name: string;
  abbreviation: string;
  colors: TeamColors;
  players: Player[];
  substitutes: Player[];
  isHomeTeam?: boolean;
  score?: number;
}

export interface Scorer {
  playerName: string;
  time: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  visitorTeam: Team;
  lastScorer: Scorer | null;
  ball?: {
    possessedBy: {
      teamId: string;
      playerId: number;
    };
    position: {
      row: number;
      column: number;
    };
  };
  latestGoal?: {
    scorerName: string;
  };
}

export interface TeamSquadView {
  team: Team;
  matchId: string;
}

export interface MatchState {
  matches: Match[];
  teamSquadView?: TeamSquadView | null;
}

export interface SubstitutionParams {
  matchId: string;
  team: Team;
  selectedPlayer: Player;
  selectedSubstitute: Player;
}

export interface SetScorerParams {
  matchId: string;
  scorer: {
    playerName: string;
    time: number;
  };
}

export interface IncreaseScoreParams {
  matchId: string;
  scorerTeam: {
    isHomeTeam: boolean;
  };
}
