import React, { createContext, useReducer } from "react";
import { matchReducer } from "../reducers/matchReducer";

export const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, { testParam: null });

  const runTest = (msg) => dispatch({ type: "TEST", payload: msg });

  return (
    <MatchContext.Provider value={{ testParam: state.testParam, runTest }}>
      {children}
    </MatchContext.Provider>
  );
};
