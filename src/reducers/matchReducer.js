export const matchReducer = (state, action) => {
  switch (action.type) {
    case "TEST":
      return { ...state, testParam: "it works!" };
    default:
      return state;
  }
};
