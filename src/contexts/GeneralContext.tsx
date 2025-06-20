import React, { createContext, useReducer, ReactNode } from 'react';
import { generalReducer, GeneralState } from '../reducers/generalReducer';
import { BaseTeam, MatchTeam } from '../types';
import teamService from '../services/teamService';

// Define the context type
interface GeneralContextType {
  state: GeneralState;
  setCurrentPage: (page: number) => void;
  getBaseTeam: () => void;
  setMatchTeam: (team: MatchTeam) => void;
  setMatchOtherTeams: () => void;
  setScreenDisplayed: (screen: string) => void;
}

// Create the default context value
const defaultContextValue: GeneralContextType = {
  state: {
    currentPage: 1,
    baseTeam: {} as BaseTeam,
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'TeamManager',
  },
  setCurrentPage: () => {},
  getBaseTeam: () => {},
  setMatchTeam: () => {},
  setMatchOtherTeams: () => {},
  setScreenDisplayed: () => {},
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
    matchOtherTeams: [],
    screenDisplayed: 'TeamManager',
  });

  const setCurrentPage = (page: number) =>
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });

  const getBaseTeam = () => {
    const baseTeam = teamService.getBaseTeam();
    dispatch({ type: 'SET_BASE_TEAM', payload: baseTeam });
  };

  const setMatchTeam = (team: MatchTeam) =>
    dispatch({ type: 'SET_MATCH_TEAM', payload: team });

  const setMatchOtherTeams = () => dispatch({ type: 'SET_MATCH_OTHER_TEAMS' });

  const setScreenDisplayed = (screen: string) =>
    dispatch({ type: 'SET_SCREEN_DISPLAYED', payload: screen });

  return (
    <GeneralContext.Provider
      value={{
        state,
        setCurrentPage,
        getBaseTeam,
        setMatchTeam,
        setMatchOtherTeams,
        setScreenDisplayed,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};
