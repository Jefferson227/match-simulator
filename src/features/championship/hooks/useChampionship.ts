import { useCallback } from 'react';
import { useChampionshipContext } from '../contexts/ChampionshipContext';
import { BaseTeam, Match, SeasonRound, TableStanding, ChampionshipConfig } from '@types';

/**
 * Custom hook to access and modify championship state
 */
export const useChampionship = () => {
  const { state, dispatch } = useChampionshipContext();

  const setChampionship = useCallback((internalName: string) => {
    dispatch({ type: 'SET_CHAMPIONSHIP', payload: internalName });
  }, [dispatch]);

  const setHumanPlayerBaseTeam = useCallback((team: BaseTeam) => {
    dispatch({ type: 'SET_HUMAN_PLAYER_BASE_TEAM', payload: team });
  }, [dispatch]);

  const setTeamsControlledAutomatically = useCallback((teams: BaseTeam[]) => {
    dispatch({ type: 'SET_TEAMS_CONTROLLED_AUTOMATICALLY', payload: teams });
  }, [dispatch]);

  const setSeasonMatchCalendar = useCallback((matches: SeasonRound[]) => {
    dispatch({ type: 'SET_SEASON_MATCH_CALENDAR', payload: matches });
  }, [dispatch]);

  const setCurrentRound = useCallback((round: number) => {
    dispatch({ type: 'SET_CURRENT_ROUND', payload: round });
  }, [dispatch]);

  const incrementCurrentRound = useCallback(() => {
    dispatch({ type: 'INCREMENT_CURRENT_ROUND' });
  }, [dispatch]);

  const updateTableStandings = useCallback((matches: Match[]) => {
    dispatch({ type: 'UPDATE_TABLE_STANDINGS', payload: matches });
  }, [dispatch]);

  const resetTableStandings = useCallback(() => {
    dispatch({ type: 'RESET_TABLE_STANDINGS' });
  }, [dispatch]);

  const getTableStandings = useCallback((): TableStanding[] => {
    return [...state.tableStandings].sort((a, b) => {
      // Sort by points (descending), then goal difference (descending), then goals for (descending)
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  }, [state.tableStandings]);

  const loadState = useCallback((savedState: typeof state) => {
    dispatch({ type: 'LOAD_STATE', payload: savedState });
  }, [dispatch]);

  const setYear = useCallback((year: number) => {
    dispatch({ type: 'SET_YEAR', payload: year });
  }, [dispatch]);

  const incrementYear = useCallback(() => {
    dispatch({ type: 'INCREMENT_YEAR' });
  }, [dispatch]);

  const setOtherChampionships = useCallback((champs: ChampionshipConfig[]) => {
    dispatch({ type: 'SET_OTHER_CHAMPIONSHIPS', payload: champs });
  }, [dispatch]);

  const addOrUpdateOtherChampionship = useCallback((championship: ChampionshipConfig) => {
    dispatch({ type: 'ADD_OR_UPDATE_OTHER_CHAMPIONSHIP', payload: championship });
  }, [dispatch]);

  return {
    // State
    selectedChampionship: state.selectedChampionship,
    humanPlayerBaseTeam: state.humanPlayerBaseTeam,
    teamsControlledAutomatically: state.teamsControlledAutomatically,
    seasonMatchCalendar: state.seasonMatchCalendar,
    currentRound: state.currentRound,
    tableStandings: state.tableStandings,
    year: state.year,
    otherChampionships: state.otherChampionships,
    
    // Actions
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
  };
};

export type UseChampionshipReturn = ReturnType<typeof useChampionship>;
