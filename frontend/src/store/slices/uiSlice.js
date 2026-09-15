import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const getInitialThemeMode = () => {
  if (typeof window !== 'undefined') {
    const cookieTheme = Cookies.get('btg_theme');
    if (cookieTheme === 'light' || cookieTheme === 'dark') return cookieTheme;
    const localTheme = localStorage.getItem('btg_theme_mode');
    if (localTheme === 'light' || localTheme === 'dark') return localTheme;
  }
  return 'dark';
};

const initialState = {
  themeMode: getInitialThemeMode(),
  isSidebarOpen: true,
  activeChatUser: null,
  activeSession: null,
  notificationDrawerOpen: false,
  unreadNotificationsCount: 0,
  unreadMessagesCount: 0,
  onlineUsers: [],
  snackbar: {
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    autoHideDuration: 4000
  }
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('btg_theme_mode', state.themeMode);
        Cookies.set('btg_theme', state.themeMode, { expires: 365, path: '/' });
        document.documentElement.setAttribute('data-theme', state.themeMode);
        document.documentElement.style.colorScheme = state.themeMode;
      }
    },
    setThemeMode: (state, action) => {
      const mode = action.payload === 'light' ? 'light' : 'dark';
      state.themeMode = mode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('btg_theme_mode', mode);
        Cookies.set('btg_theme', mode, { expires: 365, path: '/' });
        document.documentElement.setAttribute('data-theme', mode);
        document.documentElement.style.colorScheme = mode;
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    setActiveChatUser: (state, action) => {
      state.activeChatUser = action.payload;
    },
    setActiveSession: (state, action) => {
      state.activeSession = action.payload;
    },
    setNotificationDrawerOpen: (state, action) => {
      state.notificationDrawerOpen = action.payload;
    },
    setUnreadNotificationsCount: (state, action) => {
      state.unreadNotificationsCount = Math.max(0, action.payload || 0);
    },
    incrementUnreadNotifications: (state) => {
      state.unreadNotificationsCount = (state.unreadNotificationsCount || 0) + 1;
    },
    setUnreadMessagesCount: (state, action) => {
      state.unreadMessagesCount = Math.max(0, action.payload || 0);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
    },
    userCameOnline: (state, action) => {
      const userId = action.payload;
      if (userId && !state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    userWentOffline: (state, action) => {
      const userId = action.payload;
      if (userId) {
        state.onlineUsers = state.onlineUsers.filter((id) => id !== userId);
      }
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload?.message || 'Notification',
        severity: action.payload?.severity || 'info',
        autoHideDuration: action.payload?.autoHideDuration || 4000
      };
    },
    closeSnackbar: (state) => {
      state.snackbar.open = false;
    }
  }
});

export const {
  toggleThemeMode,
  setThemeMode,
  toggleSidebar,
  setSidebarOpen,
  setActiveChatUser,
  setActiveSession,
  setNotificationDrawerOpen,
  setUnreadNotificationsCount,
  incrementUnreadNotifications,
  setUnreadMessagesCount,
  setOnlineUsers,
  userCameOnline,
  userWentOffline,
  showSnackbar,
  closeSnackbar
} = uiSlice.actions;

export default uiSlice.reducer;
