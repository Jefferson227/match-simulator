import { ChampionshipFormat } from '../reducers/types';

export interface Player {
  id: string;
  position: string;
  name: string;
  strength: number;
  mood: number;
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
  score: number;
  morale: number;
  formation: string;
  overallMood: number;
}

export interface BaseTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  colors: TeamColors;
  players: Player[]; // All available players
  morale: number;
  formation: string;
  overallMood: number;
  initialOverallStrength: number;
}

export interface MatchTeam {
  id: string;
  name: string;
  abbreviation: string;
  colors: TeamColors;
  starters: Player[]; // Only selected starters
  substitutes: Player[]; // Only selected substitutes
  formation: string;
  isHomeTeam: boolean;
  score: number;
  morale: number;
  overallMood: number;
}

export interface Scorer {
  teamId: string;
  playerId: string;
  playerName: string;
  time: number;
}

export interface Match {
  id: string;
  homeTeam: MatchTeam;
  visitorTeam: MatchTeam;
  lastScorer: Scorer | null;
  ballPossession: {
    isHomeTeam: boolean;
    position: 'midfield' | 'defense' | 'attack';
  };
  shotAttempts: number;
  scorers: (Scorer & { isHomeTeam: boolean })[];
  // ball?: {
  //   possessedBy: {
  //     teamId: string;
  //     playerId: number;
  //   };
  //   position: {
  //     row: number;
  //     column: number;
  //   };
  // };
  latestGoal?: {
    scorerName: string;
  };
  round?: number;
}

export interface TeamSquadView {
  team: MatchTeam;
  matchId: string;
}

export interface MatchState {
  matches: Match[];
  teamSquadView?: TeamSquadView | null;
}

export interface SubstitutionParams {
  matchId: string;
  team: MatchTeam;
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

export interface SeasonMatch {
  id: string;
  round: number;
  homeTeam: BaseTeam;
  awayTeam: BaseTeam;
  isPlayed: boolean;
  homeTeamScore?: number;
  awayTeamScore?: number;
}

export interface SeasonRound {
  roundNumber: number;
  matches: SeasonMatch[];
}

export interface TableStanding {
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface GroupTableStandings {
  groupId: string;
  groupName: string;
  tableStandings: TableStanding[];
}

export interface ChampionshipTeam {
  fileName: string;
  abbreviation: string;
}

export interface ChampionshipConfig {
  id: string;
  name: string;
  internalName: string;
  numberOfTeams?: number;
  promotionTeams?: number;
  relegationTeams?: number;
  promotionChampionship?: string;
  relegationChampionship?: string;
  teams?: ChampionshipTeam[]; // or string[] if not yet migrated
  teamsControlledAutomatically?: BaseTeam[];
  format: ChampionshipFormat;
}
