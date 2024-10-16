import { createStore } from 'redux';
import rootReducer from './rootReducers';




export const makeStore = () => createStore(rootReducer); 
