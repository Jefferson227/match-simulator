export const matchReducer = (state, action) => {
  switch (action.type) {
    case 'TEST':
      return { ...state, testParam: action.payload };
    case 'LOAD_MATCHES':
      return state.matches;
    default:
      return state;
  }
};
