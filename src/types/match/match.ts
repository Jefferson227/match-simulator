import { BaseTeam } from '../team/team';
import { MatchTeam } from '../team/team';
import { Player } from '../player';

export interface Scorer {
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
  playerName: string;
  time: number;
}

export interface IncreaseScoreParams {
  matchId: string;
  scorerTeam: {
    isHomeTeam: boolean;
  };
  isHomeTeam: boolean;
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
