import { MatchAction, Match, TeamSquadView } from '../types';

interface MatchState {
  matches: Match[];
  teamSquadView: TeamSquadView | null;
}

export const matchReducer = (
  state: MatchState = { matches: [], teamSquadView: null },
  action: MatchAction
): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES': {
      return {
        ...state,
        matches: action.payload.map((match) => ({
          id: crypto.randomUUID(),
          homeTeam: { ...match.homeTeam, score: 0 },
          visitorTeam: { ...match.visitorTeam, score: 0 },
          lastScorer: null,
          ballPossession: {
            isHomeTeam: true,
            position: 'midfield',
          },
          shotAttempts: 0,
          scorers: [],
          round: 0,
          isFinished: false,
          date: new Date(),
        })),
      };
    }

    case 'SET_SCORER': {
      const { matchId, scorer } = action.payload;
      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== matchId) return match;
          
          // Update the team's score
          const updatedMatch = { ...match };
          if (scorer.isHomeTeam) {
            updatedMatch.homeTeam = {
              ...updatedMatch.homeTeam,
              score: (updatedMatch.homeTeam.score || 0) + 1,
            };
          } else {
            updatedMatch.visitorTeam = {
              ...updatedMatch.visitorTeam,
              score: (updatedMatch.visitorTeam.score || 0) + 1,
            };
          }

          // Update last scorer
          updatedMatch.lastScorer = scorer;
          
          // Add to scorers array
          updatedMatch.scorers = [...updatedMatch.scorers, scorer];
          
          return updatedMatch;
        }),
      };
    }

    case 'INCREASE_SCORE': {
      const { matchId, scorerTeam } = action.payload;
      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== matchId) return match;
          
          const updatedMatch = { ...match };
          if (scorerTeam.isHomeTeam) {
            updatedMatch.homeTeam = {
              ...updatedMatch.homeTeam,
              score: (updatedMatch.homeTeam.score || 0) + 1,
            };
          } else {
            updatedMatch.visitorTeam = {
              ...updatedMatch.visitorTeam,
              score: (updatedMatch.visitorTeam.score || 0) + 1,
            };
          }
          
          return updatedMatch;
        }),
      };
    }

    case 'SET_TEAM_SQUAD_VIEW':
      return {
        ...state,
        teamSquadView: action.payload.teamSquadView,
      };

    case 'CONFIRM_SUBSTITUTION': {
      const { matchId, team, playerOut, playerIn, isHomeTeam } = action.payload;
      
      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== matchId) return match;
          
          const updatedMatch = { ...match };
          const teamKey = isHomeTeam ? 'homeTeam' : 'visitorTeam';
          
          // Update lineup and substitutes
          updatedMatch[teamKey] = {
            ...updatedMatch[teamKey],
            lineup: updatedMatch[teamKey].lineup?.map((player) =>
              player.id === playerOut.id ? { ...playerIn, position: playerOut.position } : player
            ),
            substitutes: updatedMatch[teamKey].substitutes?.map((player) =>
              player.id === playerIn.id ? { ...playerOut, position: 'SUB' } : player
            ),
          };
          
          return updatedMatch;
        }),
      };
    }

    case 'LOAD_STATE':
      return {
        matches: action.payload.matches,
        teamSquadView: action.payload.teamSquadView,
      };

    default:
      return state;
  }
};
