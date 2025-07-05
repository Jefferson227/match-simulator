import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ChampionshipState,
  ChampionshipAction,
  championshipReducer,
  initialChampionshipState,
} from '../reducers/championshipReducer';
import { BaseTeam, SeasonRound, Match, TableStanding } from '../types';

// Championship context interface
interface ChampionshipContextType {
  state: ChampionshipState;
  dispatch: React.Dispatch<ChampionshipAction>;
  setChampionship: (internalName: string) => void;
  setHumanPlayerBaseTeam: (team: BaseTeam) => void;
  setTeamsControlledAutomatically: (teams: BaseTeam[]) => void;
  setSeasonMatchCalendar: (matches: SeasonRound[]) => void;
  setCurrentRound: (round: number) => void;
  incrementCurrentRound: () => void;
  updateTableStandings: (matches: Match[]) => void;
  getTableStandings: () => TableStanding[];
  loadState: (state: ChampionshipState) => void;
  setYear: (year: number) => void;
  incrementYear: () => void;
}

// Create the context
const ChampionshipContext = createContext<ChampionshipContextType | undefined>(
  undefined
);

// Championship provider props
interface ChampionshipProviderProps {
  children: ReactNode;
}

// Championship provider component
export const ChampionshipProvider: React.FC<ChampionshipProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    championshipReducer,
    initialChampionshipState
  );

  const setChampionship = (internalName: string) => {
    dispatch({ type: 'SET_CHAMPIONSHIP', payload: internalName });
  };

  const setHumanPlayerBaseTeam = (team: BaseTeam) => {
    dispatch({ type: 'SET_HUMAN_PLAYER_BASE_TEAM', payload: team });
  };

  const setTeamsControlledAutomatically = (teams: BaseTeam[]) => {
    dispatch({ type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY', payload: teams });
  };

  const setSeasonMatchCalendar = (matches: SeasonRound[]) => {
    dispatch({ type: 'SET_SEASON_MATCH_CALENDAR', payload: matches });
  };

  const setCurrentRound = (round: number) => {
    dispatch({ type: 'SET_CURRENT_ROUND', payload: round });
  };

  const incrementCurrentRound = () => {
    dispatch({ type: 'INCREMENT_CURRENT_ROUND' });
  };

  const updateTableStandings = (matches: Match[]) => {
    dispatch({ type: 'UPDATE_TABLE_STANDINGS', payload: matches });
  };

  const getTableStandings = () => {
    return state.tableStandings;
  };

  const loadState = (newState: ChampionshipState) => {
    dispatch({ type: 'LOAD_STATE', payload: newState });
  };

  const setYear = (year: number) => {
    dispatch({ type: 'SET_YEAR', payload: year });
  };

  const incrementYear = () => {
    dispatch({ type: 'INCREMENT_YEAR' });
  };

  const value: ChampionshipContextType = {
    state,
    dispatch,
    setChampionship,
    setHumanPlayerBaseTeam,
    setTeamsControlledAutomatically,
    setSeasonMatchCalendar,
    setCurrentRound,
    incrementCurrentRound,
    updateTableStandings,
    getTableStandings,
    loadState,
    setYear,
    incrementYear,
  };

  return (
    <ChampionshipContext.Provider value={value}>
      {children}
    </ChampionshipContext.Provider>
  );
};

// Custom hook to use the championship context
export const useChampionshipContext = (): ChampionshipContextType => {
  const context = useContext(ChampionshipContext);
  if (context === undefined) {
    throw new Error(
      'useChampionshipContext must be used within a ChampionshipProvider'
    );
  }
  return context;
};
