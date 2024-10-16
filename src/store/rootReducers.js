// features/rootReducer.js

import { combineReducers } from 'redux';
import dashboardReducer from './dashboard/dashboardReducer';
import loaderReducer from './loader/loaderReducer';
import authReducer from './auth/authReducer';
// Import other reducers

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  loader: loaderReducer,
});

export default rootReducer;
