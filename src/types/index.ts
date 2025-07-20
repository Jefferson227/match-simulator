// Import types for use in this file
import { Player } from './player';
import { TeamColors } from './team/team';

// Re-export all types from their respective domain files
export * from './player';

export * from './team/team';
export * from './match/match';

export * from './championship/championship';
export * from './championship/table';

// Re-export commonly used types for backward compatibility
export type { BaseTeam, MatchTeam } from './team/team';
export type { Scorer, Match, TeamSquadView, MatchState, SubstitutionParams, SetScorerParams, IncreaseScoreParams, SeasonMatch, SeasonRound } from './match/match';

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

// Export types that are used across multiple domains
export type { ChampionshipTeam, ChampionshipConfig, ChampionshipState } from './championship/championship';
export type { TableStanding } from './championship/table';
