import { Player } from '../../../types/player/player';
import { BaseTeam } from '../../../types/team/team';

export interface MatchTeam extends Omit<BaseTeam, 'formation'> {
  score?: number;
  possession: number;
  shotAttempts: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  formation: string;
  lineup?: Player[];
  substitutes?: Player[];
}

export interface Scorer {
  playerId: string;
  playerName: string;
  time: number;
  isHomeTeam: boolean;
  isPenalty?: boolean;
  isOwnGoal?: boolean;
}

export interface Match {
  id: string;
  homeTeam: MatchTeam;
  visitorTeam: MatchTeam;
  lastScorer: Scorer | null;
  ballPossession: {
    isHomeTeam: boolean;
    position: 'defense' | 'midfield' | 'attack';
  };
  shotAttempts: number;
  scorers: Scorer[];
  round: number;
  isFinished: boolean;
  date: Date;
  venue?: string;
  attendance?: number;
  weather?: string;
  temperature?: number;
}

export interface MatchState {
  matches: Match[];
  teamSquadView: TeamSquadView | null;
}

export interface TeamSquadView {
  matchId: string;
  team: MatchTeam;
  isHomeTeam: boolean;
}

export interface SubstitutionParams {
  matchId: string;
  team: MatchTeam;
  playerOut: Player;
  playerIn: Player;
  isHomeTeam: boolean;
}

export type MatchAction =
  | {
      type: 'SET_MATCHES';
      payload: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[];
    }
  | { type: 'SET_SCORER'; payload: { matchId: string; scorer: Scorer } }
  | {
      type: 'INCREASE_SCORE';
      payload: { matchId: string; scorerTeam: { isHomeTeam: boolean } };
    }
  | {
      type: 'SET_TEAM_SQUAD_VIEW';
      payload: { teamSquadView: TeamSquadView | null };
    }
  | { type: 'CONFIRM_SUBSTITUTION'; payload: SubstitutionParams }
  | {
      type: 'LOAD_STATE';
      payload: { matches: Match[]; teamSquadView: TeamSquadView | null };
    };

export interface MatchContextType {
  matches: Match[];
  teamSquadView: TeamSquadView | null | undefined;
  setMatches: (
    teams: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[]
  ) => void;
  setScorer: (matchId: string, scorer: Scorer) => void;
  increaseScore: (
    matchId: string,
    scorerTeam: { isHomeTeam: boolean }
  ) => void;
  setTeamSquadView: (teamSquadView: TeamSquadView | null) => void;
  confirmSubstitution: (params: SubstitutionParams) => void;
  loadState: (matches: Match[], teamSquadView: TeamSquadView | null) => void;
}

export interface MatchSimulatorProps {
  onMatchEnd?: (matches: Match[]) => void;
  onTimeUpdate?: (time: number) => void;
  onGoalScored?: (match: Match, scorer: Scorer) => void;
  onMatchStart?: (matches: Match[]) => void;
  onMatchPause?: () => void;
  onMatchResume?: () => void;
  onMatchReset?: () => void;
  clockSpeed?: number;
  autoStart?: boolean;
  showControls?: boolean;
  className?: string;
}
