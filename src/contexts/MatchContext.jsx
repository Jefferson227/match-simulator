import { createContext, useReducer } from 'react';
import { matchReducer } from '../reducers/matchReducer';

export const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, {
    matches: [],
  });

  const setMatches = (teams) =>
    dispatch({ type: 'SET_MATCHES', payload: teams });
  const setScorer = (matchId, scorer) =>
    dispatch({ type: 'SET_SCORER', payload: { matchId, scorer } });
  const increaseScore = (matchId, scorerTeam) =>
    dispatch({
      type: 'INCREASE_SCORE',
      payload: { matchId, scorerTeam },
    });

  return (
    <MatchContext.Provider
      value={{
        matches: state.matches,
        setMatches,
        setScorer,
        increaseScore,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};
