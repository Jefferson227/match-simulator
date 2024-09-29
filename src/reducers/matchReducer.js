export const matchReducer = (state, action) => {
  switch (action.type) {
    case 'SET_MATCHES': {
      const { homeTeam, visitorTeam } = action.payload;

      return {
        ...state,
        matches: [
          ...state.matches,
          {
            id: crypto.randomUUID,
            homeTeam: {
              ...homeTeam,
              isHomeTeam: true,
              score: 0,
            },
            visitorTeam: {
              ...visitorTeam,
              isHomeTeam: false,
              score: 0,
            },
            lastScorer: {},
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
    default:
      return state;
  }
};
