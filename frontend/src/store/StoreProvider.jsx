'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import Cookies from 'js-cookie';
import { store } from './index';
import { setThemeMode } from './slices/uiSlice';

export default function StoreProvider({ children, initialTheme = 'dark' }) {
  // Sync immediately if server identified initialTheme
  if (initialTheme && (initialTheme === 'light' || initialTheme === 'dark')) {
    if (store.getState().ui?.themeMode !== initialTheme) {
      store.dispatch(setThemeMode(initialTheme));
    }
  }

  useEffect(() => {
    try {
      const cookieTheme = Cookies.get('btg_theme');
      const localTheme = localStorage.getItem('btg_theme_mode');
      const savedTheme = cookieTheme || localTheme || initialTheme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        if (store.getState().ui?.themeMode !== savedTheme) {
          store.dispatch(setThemeMode(savedTheme));
        }
      }
    } catch (e) {}
  }, [initialTheme]);

  return <Provider store={store}>{children}</Provider>;
}
