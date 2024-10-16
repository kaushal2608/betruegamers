// features/employeelifecycle/employeelifecycleActions.js

import { apiWithAuth } from '../../utils/api';
import { Route, routesMapping } from '../../utils/apiRoutes';
import { commonRequest } from '../../utils/helper';
import { loadingShow } from '../loader/loaderActions';
import { SET_PENDING_WORKFLOW_DATA } from './dashboardTypes';



// Thunk for getting pending workflow dashboard data
export const getPendingWorkFlowDashboard = () => async (dispatch) => {
  dispatch(loadingShow(true));
  try {
    const response = await commonRequest(
      apiWithAuth,
      Route(routesMapping.employeelifecycle.GetPendingWorkFlowDashboard),
      {},
      'GET',
      {},
    );
    dispatch({
      type: SET_PENDING_WORKFLOW_DATA,
      payload: response.data,
    });
  } catch (error) {
    console.log(error)
  } finally {
    dispatch(loadingShow(false));
  }
};

// Additional thunks for other API calls can be created similarly
