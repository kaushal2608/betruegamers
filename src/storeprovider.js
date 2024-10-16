// src/storeprovider.js
"use client";
import React from 'react';
import { Provider } from 'react-redux'; // Import Provider from react-redux
import { makeStore } from './store/store';


export const StoreProvider = ({ children }) => {
  return <Provider store={makeStore}>{children}</Provider>;
};
