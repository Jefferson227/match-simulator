import { BaseTeam } from '../../../types/team/team';

export interface TeamStanding {
  team: string;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
}

export interface TableStanding {
  teamAbbreviation: string;
  wins: number;
  draws: number;
  losses: number;
  goalDifference: number;
  points: number;
}

export interface StandingsState {
  standings: TeamStanding[];
  currentPage: number;
  isLoading: boolean;
  error: string | null;
}

export interface StandingsContextType {
  state: StandingsState;
  getStandings: () => TeamStanding[];
  getTableStandings: () => TableStanding[];
  setCurrentPage: (page: number) => void;
  refreshStandings: () => Promise<void>;
  resetStandings: () => void;
}

export interface StandingsProviderProps {
  children: React.ReactNode;
  initialStandings?: TeamStanding[];
}

export interface StandingsTableProps {
  standings: TeamStanding[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onContinue: () => void;
  isSeasonComplete: boolean;
  championshipName: string;
  year: number;
  currentRound: number;
  totalRounds: number;
}

export interface StandingsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onContinue: () => void;
  isSeasonComplete: boolean;
}

export interface StandingsHeaderProps {
  championshipName: string;
  year: number;
  currentRound: number;
  totalRounds: number;
  isSeasonComplete: boolean;
}
