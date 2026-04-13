import type MatchResult from '../enums/MatchResult';

export const MATCH_RESULT = {
  WIN: 'win' as MatchResult,
  DRAW: 'draw' as MatchResult,
  LOSS: 'loss' as MatchResult,
} as const;
