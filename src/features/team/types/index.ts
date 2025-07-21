import { Player } from '../../../../types/player';
import { Team } from '../../../../types/team';

export interface TeamState {
  // Team data
  selectedTeam: Team | null;
  availablePlayers: Player[];
  selectedFormation: string;
  selectedPlayerId: string | null;
  
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
}

export interface TeamActions {
  // Team selection and management
  selectTeam: (team: Team | null) => Promise<void>;
  setFormation: (formation: string) => Promise<void>;
  saveTeam: () => Promise<boolean>;
  refreshTeam: () => Promise<void>;
  
  // Player management
  selectPlayer: (playerId: string | null) => void;
  updatePlayerPosition: (playerId: string, position: string) => Promise<boolean>;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  
  // Additional utilities
  getAvailableFormations?: () => Promise<string[]>;
}

export interface TeamContextType extends TeamState, TeamActions {}

export interface TeamProviderProps {
  initialTeam?: Team | null;
  children: React.ReactNode;
}
