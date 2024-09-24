import { createContext, useReducer } from 'react';
import { matchReducer } from '../reducers/matchReducer';

export const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, {
    testParam: null,
    matches: [],
  });

  const runTest = (msg) => dispatch({ type: 'TEST', payload: msg });
  const loadMatches = () => dispatch({ type: 'LOAD_MATCHES' });

  return (
    <MatchContext.Provider
      value={{
        testParam: state.testParam,
        matches: state.matches,
        runTest,
        loadMatches,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};
