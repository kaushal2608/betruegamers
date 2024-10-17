import { SET_SNACKBAR } from "./appType";

  
  const initialState = {
    snackBar: {
      snackbarOpen: false,
      snackbarType: "success",
      snackbarMessage: "",
    },
  };
  
  const appReducer = function (state = initialState, action) {
    //console.log('appReducer calling',action);
    const { type, payload } = action;
    switch (type) {
      case SET_SNACKBAR:
        const { snackbarOpen, snackbarType, snackbarMessage } = payload;
        return {
          ...state,
          snackBar: {
            snackbarOpen,
            snackbarType,
            snackbarMessage,
          },
        };
      default:
        return state;
    }
  };
  
  export default appReducer;
  