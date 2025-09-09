import { createContext, useReducer, ReactNode } from 'react';
import { matchReducer } from '../reducers/matchReducer';
import { Match, SubstitutionParams, TeamSquadView, Scorer, MatchTeam } from '../types';
import { MatchTeams } from '../reducers/types';
import { MatchContextType, MatchProviderProps } from './types';

export type MatchAction =
  | {
      type: 'SET_MATCHES';
      payload: MatchTeams[];
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
  | { type: 'CONFIRM_SUBSTITUTION'; payload: SubstitutionParams }
  | {
      type: 'LOAD_STATE';
      payload: { matches: Match[]; teamSquadView: TeamSquadView | null };
    };

const defaultContextValue: MatchContextType = {
  matches: [],
  teamSquadView: null,
  setMatches: () => {},
  setScorer: () => {},
  increaseScore: () => {},
  setTeamSquadView: () => {},
  confirmSubstitution: () => {},
  loadState: () => {},
};

export const MatchContext = createContext<MatchContextType>(defaultContextValue);

export const MatchProvider: React.FC<MatchProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(matchReducer, {
    matches: [],
  });

  const setMatches = (teams: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[]) =>
    dispatch({ type: 'SET_MATCHES', payload: teams });

  const setScorer = (matchId: string, scorer: Scorer) =>
    dispatch({ type: 'SET_SCORER', payload: { matchId, scorer } });

  const increaseScore = (matchId: string, scorerTeam: { isHomeTeam: boolean }) =>
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

  const loadState = (matches: Match[], teamSquadView: TeamSquadView | null) =>
    dispatch({
      type: 'LOAD_STATE',
      payload: { matches, teamSquadView },
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
        loadState,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};
