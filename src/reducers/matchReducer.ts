import utils from '../utils/utils';
import { MatchState } from '../types';
import { MatchAction } from '../contexts/MatchContext';

const { addPlayerAttributes, getAverage } = utils;

export const matchReducer = (state: MatchState, action: MatchAction): MatchState => {
  switch (action.type) {
    case 'SET_MATCHES': {
      // Accept an array of { homeTeam, visitorTeam }
      const matchesPayload = Array.isArray(action.payload) ? action.payload : [action.payload];
      const newMatches = matchesPayload.map(({ homeTeam, visitorTeam }) => {
        var updatedHomeTeam = {
          ...homeTeam,
          starters: addPlayerAttributes(homeTeam.starters),
          substitutes: addPlayerAttributes(homeTeam.substitutes),
          isHomeTeam: true,
          score: 0,
          morale: 50,
          overallMood: 0,
        };
        updatedHomeTeam.overallMood = getAverage(updatedHomeTeam.starters.map((p) => p.mood));
        var updatedVisitorTeam = {
          ...visitorTeam,
          starters: addPlayerAttributes(visitorTeam.starters),
          substitutes: addPlayerAttributes(visitorTeam.substitutes),
          isHomeTeam: false,
          score: 0,
          morale: 50,
          overallMood: 0,
        };
        updatedVisitorTeam.overallMood = getAverage(updatedVisitorTeam.starters.map((p) => p.mood));
        return {
          id: crypto.randomUUID(),
          homeTeam: { ...updatedHomeTeam },
          visitorTeam: { ...updatedVisitorTeam },
          lastScorer: null,
          ballPossession: {
            isHomeTeam: true,
            position: 'midfield' as 'midfield',
          },
          shotAttempts: 0,
          scorers: [],
        };
      });
      return {
        ...state,
        matches: newMatches,
      };
    }
    case 'SET_SCORER': {
      const { matchId, scorer } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id === matchId) {
            // Determine if the scorer is from the home team
            const isHomeTeam = m.homeTeam.starters.some((p) => p.name === scorer.playerName);
            return {
              ...m,
              lastScorer: {
                playerName: scorer.playerName,
                time: scorer.time,
              },
              scorers: [...(m.scorers || []), { ...scorer, isHomeTeam }],
            };
          }
          return m;
        }),
      };
    }
    case 'INCREASE_SCORE': {
      const { matchId, scorerTeam } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id === matchId) {
            // Create a new copy of the match
            const updatedMatch = { ...m };

            // Find the team (either homeTeam or visitorTeam)
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
          }

          return m;
        }),
      };
    }
    case 'SET_TEAM_SQUAD_VIEW': {
      const { teamSquadView } = action.payload;

      return {
        ...state,
        teamSquadView,
      };
    }
    case 'CONFIRM_SUBSTITUTION': {
      const { matchId, team, selectedPlayer, selectedSubstitute } = action.payload;

      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id !== matchId) return match;

          // Create a new copy of the match
          const updatedMatch = { ...match };

          const isTeamHomeOrVisitor = team.isHomeTeam ? 'homeTeam' : 'visitorTeam';

          // Remove the substituted player from the main squad
          const filteredPlayers = updatedMatch[isTeamHomeOrVisitor].starters.filter(
            (p) => p.id !== selectedPlayer.id
          );

          // Sort the players from the main squad plus the substitute by order
          const sortedPlayers = [...filteredPlayers, selectedSubstitute].sort((a, b) => {
            if ((a.order ?? 0) < (b.order ?? 0)) {
              return -1; // a comes before b
            }
            if ((a.order ?? 0) > (b.order ?? 0)) {
              return 1; // a comes after b
            }
            return 0; // a and b are equal
          });

          // Remove the changed player from the substitutes
          const filteredSubstitutes = updatedMatch[isTeamHomeOrVisitor].substitutes.filter(
            (s) => s.id !== selectedSubstitute.id
          );

          // Update the team
          updatedMatch[isTeamHomeOrVisitor] = {
            ...updatedMatch[isTeamHomeOrVisitor],
            starters: sortedPlayers,
            substitutes: filteredSubstitutes,
          };

          return updatedMatch;
        }),
      };
    }
    case 'LOAD_STATE': {
      const { matches, teamSquadView } = action.payload;
      return {
        ...state,
        matches,
        teamSquadView,
      };
    }
    default:
      return state;
  }
};
