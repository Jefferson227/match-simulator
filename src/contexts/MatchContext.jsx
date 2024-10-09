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
  const setTeamSquadView = (teamSquadView) =>
    dispatch({
      type: 'SET_TEAM_SQUAD_VIEW',
      payload: { teamSquadView },
    });
  const confirmSubstitution = ({
    matchId,
    team,
    selectedPlayer,
    selectedSubstitute,
  }) =>
    dispatch({
      type: 'CONFIRM_SUBSTITUTION',
      payload: { matchId, team, selectedPlayer, selectedSubstitute },
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
