import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { generalReducer, GeneralState } from '../reducers/generalReducer';
import { BaseTeam, MatchTeam } from '../types';
import teamService from '../services/teamService';

// Define the context type
interface GeneralContextType {
  state: GeneralState;
  setCurrentPage: (page: number) => void;
  getBaseTeam: () => void;
  setMatchStarted: (isStarted: boolean) => void;
  setMatchTeam: (team: MatchTeam) => void;
}

// Create the default context value
const defaultContextValue: GeneralContextType = {
  state: {
    currentPage: 1,
    baseTeam: {} as BaseTeam,
    matchTeam: null,
    isMatchStarted: false,
  },
  setCurrentPage: () => {},
  getBaseTeam: () => {},
  setMatchStarted: () => {},
  setMatchTeam: () => {},
};

// Create the context
export const GeneralContext =
  createContext<GeneralContextType>(defaultContextValue);

// Create the provider component
interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider: React.FC<GeneralProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(generalReducer, {
    currentPage: 1,
    baseTeam: {} as BaseTeam,
    matchTeam: null,
    isMatchStarted: false,
  });

  const setCurrentPage = (page: number) =>
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });

  const getBaseTeam = () => {
    const baseTeam = teamService.getBaseTeam();
    dispatch({ type: 'SET_BASE_TEAM', payload: baseTeam });
  };

  const setMatchStarted = (isStarted: boolean) =>
    dispatch({ type: 'SET_MATCH_STARTED', payload: isStarted });

  const setMatchTeam = (team: MatchTeam) =>
    dispatch({ type: 'SET_MATCH_TEAM', payload: team });

  return (
    <GeneralContext.Provider
      value={{
        state,
        setCurrentPage,
        getBaseTeam,
        setMatchStarted,
        setMatchTeam,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};
