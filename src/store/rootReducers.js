// features/rootReducer.js

import { combineReducers } from 'redux';
import dashboardReducer from './dashboard/dashboardReducer';
import loaderReducer from './loader/loaderReducer';
// Import other reducers

const rootReducer = combineReducers({
  dashboard: dashboardReducer,
  loader: loaderReducer,
});

export default rootReducer;
