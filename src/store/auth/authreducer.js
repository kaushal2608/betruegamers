// features/employeelifecycle/employeelifecycleReducer.js

import { USER_DATA } from './authTypes';

  const initialState = {
    UserData: [],
  };
  
  const dashboardReducer = (state = initialState, action) => {
    switch (action.type) {
      case USER_DATA:
        return {
          ...state,
          UserData: action.payload,
        };
      default:
        return state;
    }
  };
  
  export default dashboardReducer;
  