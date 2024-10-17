// features/rootReducer.js

import { combineReducers } from 'redux';
import dashboardReducer from './dashboard/dashboardReducer';
import loaderReducer from './loader/loaderReducer';
import authReducer from './auth/authReducer';
import appReducer from './app/appReducer';
// Import other reducers

const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  loader: loaderReducer,
  app: appReducer,
});

export default rootReducer;
