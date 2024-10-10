import utils from '../utils/utils';
const { addPlayerAttributes } = utils;

export const matchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MATCHES': {
      const { homeTeam, visitorTeam } = action.payload;

      return {
        ...state,
        matches: [
          ...state.matches,
          {
            id: crypto.randomUUID(),
            homeTeam: {
              ...homeTeam,
              players: addPlayerAttributes(homeTeam.players),
              substitutes: addPlayerAttributes(homeTeam.substitutes),
              isHomeTeam: true,
              score: 0,
            },
            visitorTeam: {
              ...visitorTeam,
              players: addPlayerAttributes(visitorTeam.players),
              substitutes: addPlayerAttributes(visitorTeam.substitutes),
              isHomeTeam: false,
              score: 0,
            },
            lastScorer: null,
          },
        ],
      };
    }
    case 'SET_SCORER': {
      const { matchId, scorer } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          return m.id === matchId
            ? {
                ...m,
                lastScorer: {
                  playerName: scorer.playerName,
                  time: scorer.time,
                },
              }
            : m;
        }),
      };
    }
    case 'INCREASE_SCORE': {
      const { matchId, scorerTeam } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id === matchId) {
            const team = Object.values(m).find(
              (team) => team.isHomeTeam === scorerTeam.isHomeTeam
            );

            team.score = team.score + 1;
            return m;
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
      const { matchId, team, selectedPlayer, selectedSubstitute } =
        action.payload;

      return {
        ...state,
        matches: state.matches.map((match) => {
          if (match.id === matchId) {
            const teamFound = Object.values(match).find(
              (t) => t.isHomeTeam === team.isHomeTeam
            );

            // remove the player from the main squad
            teamFound.players = teamFound.players.filter(
              (p) => p.id !== selectedPlayer.id
            );

            // add the substitute player in the main squad in the correct order
            teamFound.players = [...teamFound.players, selectedSubstitute].sort(
              (a, b) => {
                if (a.order < b.order) {
                  return -1; // a comes before b
                }
                if (a.order > b.order) {
                  return 1; // a comes after b
                }
                return 0; // a and b are equal
              }
            );

            // remove the substitute player from the substitutes
            teamFound.substitutes = teamFound.substitutes.filter(
              (s) => s.id !== selectedSubstitute.id
            );

            return match;
          }

          return match;
        }),
      };
    }
    default:
      return state;
  }
};
