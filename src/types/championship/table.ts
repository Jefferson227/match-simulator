// TableStanding represents a team's position in the league table
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

// TableProps defines the props for the Table component
export interface TableProps {
  standings: TableStanding[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onContinue?: () => void;
  isSeasonComplete?: boolean;
}

// Export all types from this file
export type { TableStanding as default };

