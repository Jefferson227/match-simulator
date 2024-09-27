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
            homeTeam,
            visitorTeam,
            lastScorer: {},
          },
        ],
      };
    }
    case 'SET_SCORER': {
      const { matchId, scorer, time } = action.payload;

      return {
        ...state,
        matches: state.matches.map((m) => {
          return m.id === matchId
            ? {
                ...m,
                lastScorer: { scorer, time },
              }
            : m;
        }),
      };
    }
    default:
      return state;
  }
};
