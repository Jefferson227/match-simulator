import { createContext, ReactNode, useReducer } from 'react';
import { matchReducer } from '../reducers/matchReducer';
import { MatchAction, MatchContextType, MatchState, MatchTeam } from '../types';

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

interface MatchProviderProps {
  children: ReactNode;
  initialState?: Partial<MatchState>;
}

export const MatchProvider: React.FC<MatchProviderProps> = ({
  children,
  initialState,
}) => {
  const [state, dispatch] = useReducer(matchReducer, {
    matches: [],
    teamSquadView: null,
    ...initialState,
  });

  const setMatches = (teams: { homeTeam: MatchTeam; visitorTeam: MatchTeam }[]) =>
    dispatch({ type: 'SET_MATCHES', payload: teams });

  const setScorer = (matchId: string, scorer: any) =>
    dispatch({ type: 'SET_SCORER', payload: { matchId, scorer } });

  const increaseScore = (matchId: string, scorerTeam: { isHomeTeam: boolean }) =>
    dispatch({
      type: 'INCREASE_SCORE',
      payload: { matchId, scorerTeam },
    });

  const setTeamSquadView = (teamSquadView: any) =>
    dispatch({
      type: 'SET_TEAM_SQUAD_VIEW',
      payload: { teamSquadView },
    });

  const confirmSubstitution = (params: any) =>
    dispatch({
      type: 'CONFIRM_SUBSTITUTION',
      payload: params,
    });

  const loadState = (matches: any[], teamSquadView: any) =>
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

export default MatchContext;
