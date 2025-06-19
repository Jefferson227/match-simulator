import { createContext, useReducer, ReactNode } from 'react';
import { matchReducer } from '../reducers/matchReducer';
import {
  Match,
  SubstitutionParams,
  TeamSquadView,
  Scorer,
  MatchTeam,
} from '../types';

export type MatchAction =
  | {
      type: 'SET_MATCHES';
      payload: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[];
    }
  | { type: 'SET_SCORER'; payload: { matchId: string; scorer: Scorer } }
  | {
      type: 'INCREASE_SCORE';
      payload: { matchId: string; scorerTeam: { isHomeTeam: boolean } };
    }
  | {
      type: 'SET_TEAM_SQUAD_VIEW';
      payload: { teamSquadView: TeamSquadView | null };
    }
  | { type: 'CONFIRM_SUBSTITUTION'; payload: SubstitutionParams };

interface MatchContextType {
  matches: Match[];
  teamSquadView: TeamSquadView | null | undefined;
  setMatches: (
    teams: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[]
  ) => void;
  setScorer: (matchId: string, scorer: Scorer) => void;
  increaseScore: (matchId: string, scorerTeam: { isHomeTeam: boolean }) => void;
  setTeamSquadView: (teamSquadView: TeamSquadView | null) => void;
  confirmSubstitution: (params: SubstitutionParams) => void;
}

const defaultContextValue: MatchContextType = {
  matches: [],
  teamSquadView: null,
  setMatches: () => {},
  setScorer: () => {},
  increaseScore: () => {},
  setTeamSquadView: () => {},
  confirmSubstitution: () => {},
};

export const MatchContext =
  createContext<MatchContextType>(defaultContextValue);

interface MatchProviderProps {
  children: ReactNode;
}

export const MatchProvider: React.FC<MatchProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, {
    matches: [],
  });

  const setMatches = (
    teams: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[]
  ) => dispatch({ type: 'SET_MATCHES', payload: teams });

  const setScorer = (matchId: string, scorer: Scorer) =>
    dispatch({ type: 'SET_SCORER', payload: { matchId, scorer } });

  const increaseScore = (
    matchId: string,
    scorerTeam: { isHomeTeam: boolean }
  ) =>
    dispatch({
      type: 'INCREASE_SCORE',
      payload: { matchId, scorerTeam },
    });

  const setTeamSquadView = (teamSquadView: TeamSquadView | null) =>
    dispatch({
      type: 'SET_TEAM_SQUAD_VIEW',
      payload: { teamSquadView },
    });

  const confirmSubstitution = (params: SubstitutionParams) =>
    dispatch({
      type: 'CONFIRM_SUBSTITUTION',
      payload: params,
    });

  return (
    <MatchContext.Provider
      value={{
        matches: state.matches,
        teamSquadView: state.teamSquadView,
        setMatches,
        setScorer,
        increaseScore,
        setTeamSquadView,
        confirmSubstitution,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};
