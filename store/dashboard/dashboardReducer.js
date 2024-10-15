// features/employeelifecycle/employeelifecycleReducer.js

import {
    SET_PENDING_WORKFLOW_DATA,
    SET_LOADING,
    SET_ERROR,
  } from './dashboardType';
  
  const initialState = {
    pendingWorkFlowDATA: [],
    loading: false,
    error: null,
  };
  
  const dashboardReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_LOADING:
        return {
          ...state,
          loading: action.payload,
        };
      case SET_PENDING_WORKFLOW_DATA:
        return {
          ...state,
          pendingWorkFlowDATA: action.payload,
        };
      case SET_ERROR:
        return {
          ...state,
          error: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default dashboardReducer;
  