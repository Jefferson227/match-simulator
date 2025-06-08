import { createContext, useReducer, ReactNode } from 'react';
import { generalReducer, GeneralState } from '../reducers/generalReducer';

// Define the context type
interface GeneralContextType {
  state: GeneralState;
  setCurrentPage: (page: number) => void;
  setSelectedTeam: (team: string | null) => void;
  setMatchStarted: (isStarted: boolean) => void;
}

// Create the default context value
const defaultContextValue: GeneralContextType = {
  state: {
    currentPage: 1,
    selectedTeam: null,
    isMatchStarted: false,
  },
  setCurrentPage: () => {},
  setSelectedTeam: () => {},
  setMatchStarted: () => {},
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
    selectedTeam: null,
    isMatchStarted: false,
  });

  const setCurrentPage = (page: number) =>
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });

  const setSelectedTeam = (team: string | null) =>
    dispatch({ type: 'SET_SELECTED_TEAM', payload: team });

  const setMatchStarted = (isStarted: boolean) =>
    dispatch({ type: 'SET_MATCH_STARTED', payload: isStarted });

  return (
    <GeneralContext.Provider
      value={{
        state,
        setCurrentPage,
        setSelectedTeam,
        setMatchStarted,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};
