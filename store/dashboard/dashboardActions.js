// features/employeelifecycle/employeelifecycleActions.js

import { apiWithAuth } from '../../utils/api';
import { Route, routesMapping } from '../../utils/apiRoutes';
import { commonRequest } from '../../utils/helper';
import { SET_PENDING_WORKFLOW_DATA, SET_LOADING, SET_ERROR } from './dashboardType';

// Action creator for setting loading state
export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading,
});

// Action creator for setting error state
export const setError = (error) => ({
  type: SET_ERROR,
  payload: error,
});

// Thunk for getting pending workflow dashboard data
export const getPendingWorkFlowDashboard = () => async (dispatch) => {
  dispatch(setLoading(true));
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
    dispatch(setError(error.message));
  } finally {
    dispatch(setLoading(false));
  }
};

// Additional thunks for other API calls can be created similarly
