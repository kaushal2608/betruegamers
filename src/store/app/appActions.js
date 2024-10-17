import { SET_SNACKBAR } from "./appType";

export const setSnackBar =
  (snackbarOpen, snackbarType, snackbarMessage) => async (dispatch) => {
    dispatch({
      type: SET_SNACKBAR,
      payload: { snackbarOpen, snackbarType, snackbarMessage },
    });
  };

