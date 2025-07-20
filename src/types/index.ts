// Import types from their respective domain files
import { Player } from './player/index.js';
import { TeamColors, BaseTeam, MatchTeam } from './team/index.js';
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
} from './match/index.js';
import { 
  ChampionshipTeam, 
  ChampionshipConfig, 
  ChampionshipState, 
  ChampionshipAction,
  TableStanding,
  TableProps
} from './championship/index.js';

// Re-export all types from their respective domain files
export * from './player/index.js';
export * from './team/index.js';
export * from './match/index.js';
export * from './championship/index.js';

// Export commonly used types for easy access
export type {
  BaseTeam,
  MatchTeam,
  TeamColors
} from './team/index.js';

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
} from './match/index.js';

export type {
  ChampionshipTeam,
  ChampionshipConfig,
  ChampionshipState,
  ChampionshipAction,
  TableStanding,
  TableProps
} from './championship/index.js';

/**
 * Common types that don't belong to a specific domain
 */
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
