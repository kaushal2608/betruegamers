// features/rootReducer.js

import { combineReducers } from 'redux';
import dashboardReducer from './dashboard/dashboardReducer';
// Import other reducers

const rootReducer = combineReducers({
  dashboard: dashboardReducer,
  // Add other reducers here
});

export default rootReducer;
