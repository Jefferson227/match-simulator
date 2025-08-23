import React, { createContext, useReducer, ReactNode } from 'react';
import { generalReducer } from '../reducers/generalReducer';
import { BaseTeam, MatchTeam } from '../types';
import { GeneralState } from '../reducers/types';

// Define the context type
interface GeneralContextType {
  state: GeneralState;
  setCurrentPage: (page: number) => void;
  getBaseTeam: () => void;
  setBaseTeam: (team: BaseTeam) => void;
  setMatchTeam: (team: MatchTeam) => void;
  setMatchOtherTeams: () => void;
  setScreenDisplayed: (screen: string) => void;
  setClockSpeed: (speed: number) => void;
  setViewingTeam: (team: BaseTeam | null) => void;
  setIsRoundOver: (isRoundOver: boolean) => void;
  loadState: (state: GeneralState) => void;
}

// Create the default context value
const defaultContextValue: GeneralContextType = {
  state: {
    currentPage: 1,
    baseTeam: {} as BaseTeam,
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'InitialScreen',
    clockSpeed: 1000,
    viewingTeam: null,
    isRoundOver: false,
  },
  setCurrentPage: () => {},
  getBaseTeam: () => {},
  setBaseTeam: () => {},
  setMatchTeam: () => {},
  setMatchOtherTeams: () => {},
  setScreenDisplayed: () => {},
  setClockSpeed: () => {},
  setViewingTeam: () => {},
  setIsRoundOver: () => {},
  loadState: () => {},
};

// Create the context
export const GeneralContext = createContext<GeneralContextType>(defaultContextValue);

// Create the provider component
interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider: React.FC<GeneralProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(generalReducer, {
    currentPage: 1,
    baseTeam: {} as BaseTeam,
    matchTeam: null,
    matchOtherTeams: [],
    screenDisplayed: 'InitialScreen',
    clockSpeed: 1000,
    viewingTeam: null,
    isRoundOver: false,
  });

  const setCurrentPage = (page: number) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page });

  const getBaseTeam = () => {
    // TODO: Implement getBaseTeam functionality
    // For now, just dispatch with empty baseTeam
    dispatch({ type: 'SET_BASE_TEAM', payload: {} as BaseTeam });
  };

  const setBaseTeam = (team: BaseTeam) => dispatch({ type: 'SET_BASE_TEAM', payload: team });

  const setMatchTeam = (team: MatchTeam) => dispatch({ type: 'SET_MATCH_TEAM', payload: team });

  const setMatchOtherTeams = () => dispatch({ type: 'SET_MATCH_OTHER_TEAMS' });

  const setScreenDisplayed = (screen: string) =>
    dispatch({ type: 'SET_SCREEN_DISPLAYED', payload: screen });

  const setClockSpeed = (speed: number) => dispatch({ type: 'SET_CLOCK_SPEED', payload: speed });

  const setViewingTeam = (team: BaseTeam | null) =>
    dispatch({ type: 'SET_VIEWING_TEAM', payload: team });

  const setIsRoundOver = (isRoundOver: boolean) =>
    dispatch({ type: 'SET_IS_ROUND_OVER', payload: isRoundOver });

  const loadState = (newState: GeneralState) => dispatch({ type: 'LOAD_STATE', payload: newState });

  return (
    <GeneralContext.Provider
      value={{
        state,
        setCurrentPage,
        getBaseTeam,
        setBaseTeam,
        setMatchTeam,
        setMatchOtherTeams,
        setScreenDisplayed,
        setClockSpeed,
        setViewingTeam,
        setIsRoundOver,
        loadState,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};
