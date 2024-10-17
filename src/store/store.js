import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './rootReducers'

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer
  })
}