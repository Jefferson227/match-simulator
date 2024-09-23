export const matchReducer = (state, action) => {
  switch (action.type) {
    case 'TEST':
      return { ...state, testParam: action.payload };
    default:
      return state;
  }
};
