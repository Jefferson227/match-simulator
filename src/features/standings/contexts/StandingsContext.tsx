import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { standingsReducer, initialState } from '../reducers/standingsReducer';
import { TeamStanding, TableStanding, StandingsContextType, StandingsProviderProps } from '../types';

const StandingsContext = createContext<StandingsContextType | undefined>(undefined);

export const StandingsProvider: React.FC<StandingsProviderProps> = ({
  children,
  initialStandings = [],
}) => {
  const [state, dispatch] = useReducer(standingsReducer, {
    ...initialState,
    standings: initialStandings,
  });

  const getStandings = useCallback((): TeamStanding[] => {
    return state.standings;
  }, [state.standings]);

  const getTableStandings = useCallback((): TableStanding[] => {
    return state.standings.map((standing) => ({
      teamAbbreviation: standing.team,
      wins: standing.w,
      draws: standing.d,
      losses: standing.l,
      goalDifference: standing.gd,
      points: standing.pts,
    }));
  }, [state.standings]);

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  }, []);

  const refreshStandings = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // In a real app, you would fetch the latest standings from an API here
      // const response = await fetch('/api/standings');
      // const data = await response.json();
      // dispatch({ type: 'SET_STANDINGS', payload: data });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to fetch standings',
      });
    }
  }, []);

  const resetStandings = useCallback(() => {
    dispatch({ type: 'RESET_STANDINGS' });
  }, []);

  return (
    <StandingsContext.Provider
      value={{
        state,
        getStandings,
        getTableStandings,
        setCurrentPage,
        refreshStandings,
        resetStandings,
      }}
    >
      {children}
    </StandingsContext.Provider>
  );
};

export const useStandings = (): StandingsContextType => {
  const context = useContext(StandingsContext);
  if (context === undefined) {
    throw new Error('useStandings must be used within a StandingsProvider');
  }
  return context;
};

export default StandingsContext;
