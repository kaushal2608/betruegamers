import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const getInitialToken = () => {
  if (typeof window === 'undefined') return null;
  return Cookies.get('btg_token') || null;
};

const initialToken = getInitialToken();

const initialState = {
  user: null,
  token: initialToken,
  isAuthenticated: !!initialToken,
  isLoading: false
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user || state.user;
      state.token = token || state.token;
      state.isAuthenticated = !!state.token;
      state.isLoading = false;
      if (typeof window !== 'undefined' && state.token) {
        Cookies.set('btg_token', state.token, { expires: 7, path: '/', sameSite: 'lax' });
      }
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        Cookies.remove('btg_token', { path: '/' });
      }
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  }
});

export const { setCredentials, updateUserProfile, logout, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;

