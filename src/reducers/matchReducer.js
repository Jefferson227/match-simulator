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
      };
    }
    default:
      return state;
  }
};
