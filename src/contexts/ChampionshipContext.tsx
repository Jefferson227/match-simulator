import React, { createContext, useContext, useReducer } from 'react';
import { championshipReducer, initialChampionshipState } from '../reducers/championshipReducer';
import { BaseTeam, SeasonRound, Match, ChampionshipConfig } from '../types';
import { ChampionshipContextType, ChampionshipProviderProps } from './types';
import { ChampionshipState } from '../reducers/types';

// Create the context
const ChampionshipContext = createContext<ChampionshipContextType | undefined>(undefined);

// Championship provider component
export const ChampionshipProvider: React.FC<ChampionshipProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(championshipReducer, initialChampionshipState);

  const setChampionship = (championship: ChampionshipConfig) => {
    dispatch({ type: 'SET_CHAMPIONSHIP', payload: championship });
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

  const resetTableStandings = () => {
    dispatch({ type: 'RESET_TABLE_STANDINGS' });
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

  const setOtherChampionships = (champs: ChampionshipConfig[]) => {
    dispatch({ type: 'SET_OTHER_CHAMPIONSHIPS', payload: champs });
  };

  const addOrUpdateOtherChampionship = (championship: ChampionshipConfig) => {
    dispatch({
      type: 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP',
      payload: championship,
    });
  };

  const updateTeamMorale = (matches: Match[]) => {
    dispatch({
      type: 'UPDATE_TEAM_MORALE',
      payload: matches,
    });
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
    resetTableStandings,
    getTableStandings,
    loadState,
    setYear,
    incrementYear,
    setOtherChampionships,
    addOrUpdateOtherChampionship,
    updateTeamMorale,
  };

  return <ChampionshipContext.Provider value={value}>{children}</ChampionshipContext.Provider>;
};

// Custom hook to use the championship context
export const useChampionshipContext = (): ChampionshipContextType => {
  const context = useContext(ChampionshipContext);
  if (context === undefined) {
    throw new Error('useChampionshipContext must be used within a ChampionshipProvider');
  }
  return context;
};
