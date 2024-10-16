// features/employeelifecycle/employeelifecycleReducer.js

import {
    SET_PENDING_WORKFLOW_DATA,
  } from './dashboardTypes';
  
  const initialState = {
    pendingWorkFlowDATA: [],
  };
  
  const dashboardReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_PENDING_WORKFLOW_DATA:
        return {
          ...state,
          pendingWorkFlowDATA: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default dashboardReducer;
  