import { ChampionshipAction, ChampionshipState, ChampionshipUpdate, ChampionshipPhaseUpdate } from '../../reducers/types';
import { BaseTeam, SeasonRound, Match, TableStanding, ChampionshipConfig } from '../../types';
import { ReactNode } from 'react';

// Championship context interface
export interface ChampionshipContextType {
  state: ChampionshipState;
  dispatch: React.Dispatch<ChampionshipAction>;
  setChampionship: (championship: ChampionshipConfig) => void;
  setHumanPlayerBaseTeam: (team: BaseTeam) => void;
  setTeamsControlledAutomatically: (teams: BaseTeam[]) => void;
  setSeasonMatchCalendar: (matches: SeasonRound[]) => void;
  setCurrentRound: (round: number) => void;
  incrementCurrentRound: () => void;
  updateTableStandings: (matches: Match[]) => void;
  resetTableStandings: () => void;
  getTableStandings: () => TableStanding[];
  loadState: (state: ChampionshipState) => void;
  setYear: (year: number) => void;
  incrementYear: () => void;
  setOtherChampionships: (champs: ChampionshipConfig[]) => void;
  addOrUpdateOtherChampionship: (championship: ChampionshipConfig) => void;
  updateTeamMorale: (matches: Match[]) => void;
  updateTopScorers: (matches: Match[]) => void;
  resetTopScorers: () => void;
  updateChampionshipState: (championshipUpdateObject: ChampionshipUpdate) => void;
  updateChampionshipPhase: (championshipPhaseUpdateObject: ChampionshipPhaseUpdate) => void;
}

// Championship provider props
export interface ChampionshipProviderProps {
  children: ReactNode;
}
