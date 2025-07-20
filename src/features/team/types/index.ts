import { Player } from '../../../../types/player';
import { Team } from '../../../../types/team';

export interface TeamState {
  selectedTeam: Team | null;
  availablePlayers: Player[];
  selectedFormation: string;
  selectedPlayerId: string | null;
}

export interface TeamActions {
  selectTeam: (team: Team | null) => void;
  updateFormation: (formation: string) => void;
  selectPlayer: (playerId: string | null) => void;
  updatePlayerPosition: (playerId: string, position: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
}

export interface TeamContextType extends TeamState, TeamActions {}

export interface TeamProviderProps {
  initialTeam?: Team | null;
  children: React.ReactNode;
}
