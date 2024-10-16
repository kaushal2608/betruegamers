// features/employeelifecycle/employeelifecycleActions.js

import { apiWithAuth } from '../../utils/api';
import { Route, routesMapping } from '../../utils/apiRoutes';
import { commonRequest } from '../../utils/helper';
import { loadingShow } from '../loader/loaderActions';
import { USER_DATA } from './authTypes';



// Thunk for getting pending workflow dashboard data
export const login = () => async (dispatch) => {
  dispatch(loadingShow(true));
  try {
    const response = await commonRequest(
      apiWithAuth,
      Route(routesMapping.auth.Login),
      {},
      'POST',
      {},
    );
    dispatch({
      type: USER_DATA,
      payload: response.data,
    });
  } catch (error) {
    console.log(error)
  } finally {
    dispatch(loadingShow(false));
  }
};


export const signup = () => async (dispatch) => {
  dispatch(loadingShow(true));
  try {
    const response = await commonRequest(
      apiWithAuth,
      Route(routesMapping.auth.Signup),
      {},
      'POST',
      {},
    );
    dispatch({
      type: USER_DATA,
      payload: response.data,
    });
  } catch (error) {
    console.log(error)
  } finally {
    dispatch(loadingShow(false));
  }
};

// Additional thunks for other API calls can be created similarly
