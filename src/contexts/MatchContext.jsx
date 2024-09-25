import { createContext, useReducer } from 'react';
import { matchReducer } from '../reducers/matchReducer';

export const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, {
    matches: [],
  });

  const setMatches = (teams) =>
    dispatch({ type: 'SET_MATCHES', payload: teams });

  return (
    <MatchContext.Provider
      value={{
        matches: state.matches,
        setMatches,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};
