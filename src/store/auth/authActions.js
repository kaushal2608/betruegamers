// features/employeelifecycle/employeelifecycleActions.js

import { apiWithAuth } from '../../utils/api';
import { Route, routesMapping } from '../../utils/apiRoutes';
import { commonRequest } from '../../utils/helper';
import { loadingShow } from '../loader/loaderActions';
import { USER_DATA } from './authTypes';



// Thunk for getting pending workflow dashboard data
export const login = (data) => async (dispatch) => {
  dispatch(loadingShow(true)); // Show loading indicator
  try {
    const response = await commonRequest(apiWithAuth, Route(routesMapping.auth.Login),
      data,
      'POST',
      {}
    );
    dispatch({type: USER_DATA, payload: response.data.data,});
    return response;
  } catch (error) {
    throw new Error(error.message);
  } finally {
    dispatch(loadingShow(false)); // Hide loading indicator
  }
};


export const signup = (data) => async (dispatch) => {
  dispatch(loadingShow(true)); // Show loading indicator
  try {
    const response = await commonRequest(apiWithAuth, Route(routesMapping.auth.Signup),
      data,
      'POST',
      {}
    );
    dispatch({type: USER_DATA, payload: response.data.data,});
    return response;
  } catch (error) {
    throw new Error(error.message);
  } finally {
    dispatch(loadingShow(false)); // Hide loading indicator
  }
};



// export const  = (data) => async (dispatch) => {
//   dispatch(loadingShow(true));
//   try {
//     const response = await commonRequest(
//       apiWithAuth,
//       Route(routesMapping.auth.Signup),
//       data,
//       'POST',
//       {},
//     );
//     dispatch({
//       type: USER_DATA,
//       payload: response.data,
//     });
//     return response;
//   } catch (error) {
//     console.log(error)
//   } finally {
//     dispatch(loadingShow(false));
//   }
// };

// Additional thunks for other API calls can be created similarly
