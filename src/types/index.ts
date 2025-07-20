// Import types for use in this file
import { Player } from './player';
import { TeamColors, BaseTeam, MatchTeam } from './team/team';
import { 
  Scorer, 
  Match, 
  TeamSquadView, 
  MatchState, 
  SubstitutionParams, 
  SetScorerParams, 
  IncreaseScoreParams, 
  SeasonMatch, 
  SeasonRound 
} from './match/match';
import { 
  ChampionshipTeam, 
  ChampionshipConfig, 
  ChampionshipState, 
  ChampionshipAction 
} from './championship/championship';
import { 
  TableStanding, 
  TableProps 
} from './championship/table';

// Re-export all types from their respective domain files for backward compatibility
export * from './player';
export * from './team/team';
export * from './match/match';
export * from './championship/championship';
export * from './championship/table';

// Export commonly used types for easy access
export type {
  BaseTeam,
  MatchTeam,
  TeamColors
} from './team/team';

export type {
  Scorer,
  Match,
  TeamSquadView,
  MatchState,
  SubstitutionParams,
  SetScorerParams,
  IncreaseScoreParams,
  SeasonMatch,
  SeasonRound
} from './match/match';

export type {
  ChampionshipTeam,
  ChampionshipConfig,
  ChampionshipState,
  ChampionshipAction
} from './championship/championship';

export type {
  TableStanding,
  TableProps
} from './championship/table';

// Common types that don't belong to a specific domain
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
