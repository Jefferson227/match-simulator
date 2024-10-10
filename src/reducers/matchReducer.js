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
              players: homeTeam.players.map((player) => {
                player.id = crypto.randomUUID();
                return player;
              }),
              substitutes: homeTeam.substitutes.map((substitute) => {
                substitute.id = crypto.randomUUID();
                return substitute;
              }),
              isHomeTeam: true,
              score: 0,
            },
            visitorTeam: {
              ...visitorTeam,
              players: visitorTeam.players.map((player) => {
                player.id = crypto.randomUUID();
                return player;
              }),
              substitutes: visitorTeam.substitutes.map((substitute) => {
                substitute.id = crypto.randomUUID();
                return substitute;
              }),
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
              (p) => p.name !== selectedPlayer.name
            );

            // add the substitute player in the main squad
            teamFound.players = [...teamFound.players, selectedSubstitute];

            // remove the substitute player from the substitutes
            teamFound.substitutes = teamFound.substitutes.filter(
              (s) => s.name !== selectedSubstitute.name
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
