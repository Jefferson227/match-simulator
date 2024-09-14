import React from "react";
import { MatchProvider } from "../contexts/MatchContext";

const AppProviders = ({ children }) => {
  return <MatchProvider>{children}</MatchProvider>;
};

export default AppProviders;
