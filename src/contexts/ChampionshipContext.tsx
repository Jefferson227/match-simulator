import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  ChampionshipState,
  ChampionshipAction,
  championshipReducer,
  initialChampionshipState,
} from '../reducers/championshipReducer';

// Championship context interface
interface ChampionshipContextType {
  state: ChampionshipState;
  dispatch: React.Dispatch<ChampionshipAction>;
  setChampionship: (internalName: string) => void;
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

  const value: ChampionshipContextType = {
    state,
    dispatch,
    setChampionship,
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
