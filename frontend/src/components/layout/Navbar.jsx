'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  Button,
  Stack,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Gamepad2,
  Bell,
  Search,
  Menu as MenuIcon,
  LogOut,
  User,
  Settings,
  Shield,
  MessageSquare,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { logout } from '@/store/slices/authSlice';
import { useLogoutUserMutation } from '@/store/api/authApi';
import { apiSlice } from '@/store/api/apiSlice';
import { socketService } from '@/services/socket.service';
import { toggleSidebar, setUnreadNotificationsCount, setUnreadMessagesCount, toggleThemeMode } from '@/store/slices/uiSlice';
import { useGetNotificationsQuery } from '@/store/api/notificationApi';
import { useGetConversationsQuery } from '@/store/api/chatApi';
import { useUpdateThemeMutation } from '@/store/api/userApi';

export default function Navbar() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const [logoutUser] = useLogoutUserMutation();
  const [updateTheme] = useUpdateThemeMutation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { unreadNotificationsCount } = useSelector((state) => state.ui);

  // Fetch initial unread notifications from DB on page load
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true
  });

  // Fetch conversations to calculate total unread chat messages
  const { data: convsData } = useGetConversationsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true
  });

  // Sync server unread count with redux state
  React.useEffect(() => {
    if (notifData && typeof notifData.unreadCount === 'number') {
      dispatch(setUnreadNotificationsCount(notifData.unreadCount));
    }
  }, [notifData, dispatch]);

  const totalUnreadMessages = React.useMemo(() => {
    return (convsData?.data || []).reduce((acc, c) => acc + (c.unread_count || 0), 0);
  }, [convsData]);

  const displayNotifCount = typeof notifData?.unreadCount === 'number'
    ? notifData.unreadCount
    : unreadNotificationsCount;

  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleCloseMenu();
    try {
      await logoutUser().unwrap();
    } catch (e) {}
    socketService.disconnect();
    dispatch(apiSlice.util.resetApiState());
    dispatch(setUnreadNotificationsCount(0));
    dispatch(setUnreadMessagesCount(0));
    dispatch(logout());
    router.push('/login');
  };

  const handleToggleTheme = async () => {
    const nextMode = theme.palette.mode === 'dark' ? 'light' : 'dark';
    dispatch(toggleThemeMode());
    if (isAuthenticated) {
      try {
        await updateTheme(nextMode).unwrap();
      } catch (e) {
        // silent fail if offline
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: isDark ? 'rgba(8, 10, 15, 0.90)' : 'rgba(255, 255, 255, 0.90)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? 'none' : '0 1px 12px rgba(0, 0, 0, 0.05)',
        zIndex: 1200
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 68 }}>
        {/* Left: Hamburger & Brand */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => dispatch(toggleSidebar())}
            sx={{ color: 'text.primary', '&:hover': { color: 'primary.main' } }}
          >
            <MenuIcon size={22} />
          </IconButton>

          <Stack direction="row" alignItems="center" spacing={1.5} component={Link} href="/home" sx={{ textDecoration: 'none' }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDark ? '0 0 15px rgba(0, 240, 255, 0.4)' : '0 2px 10px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Gamepad2 size={22} color={theme.palette.primary.contrastText} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.04em', display: { xs: 'none', sm: 'block' } }}>
              BE<span style={{ color: theme.palette.primary.main }}>TRUE</span>GAMERS
            </Typography>
          </Stack>
        </Stack>

        {/* Center: Search Box */}
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: isDark ? 'background.card' : 'rgba(0, 0, 0, 0.04)',
            borderRadius: '24px',
            px: 2,
            py: 0.6,
            border: '1px solid',
            borderColor: 'divider',
            width: '320px',
            transition: 'all 0.2s ease',
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: isDark ? '0 0 10px rgba(0, 240, 255, 0.25)' : '0 0 10px rgba(2, 132, 199, 0.2)'
            }
          }}
        >
          <Search size={18} color={theme.palette.text.secondary} />
          <InputBase
            placeholder="Search games, coaches, players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ ml: 1.5, flex: 1, color: 'text.primary', fontSize: '0.9rem' }}
          />
        </Box>

        {/* Right: Actions, Theme Switcher & User Avatar */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Theme Toggle Button */}
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              onClick={handleToggleTheme}
              sx={{
                color: isDark ? '#eab308' : '#0284c7',
                bgcolor: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
                borderRadius: '10px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  bgcolor: isDark ? 'rgba(234, 179, 8, 0.16)' : 'rgba(2, 132, 199, 0.16)'
                }
              }}
            >
              {isDark ? <Sun size={19} /> : <Moon size={19} />}
            </IconButton>
          </Tooltip>

          {isAuthenticated && (
            <Button
              component={Link}
              href="/sessions"
              startIcon={<Calendar size={17} />}
              sx={{
                display: { xs: 'none', md: 'flex' },
                color: 'text.primary',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.7,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }
              }}
            >
              Sessions
            </Button>
          )}

          <IconButton
            component={Link}
            href="/chat"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <Badge badgeContent={totalUnreadMessages} color="secondary" max={99}>
              <MessageSquare size={20} />
            </Badge>
          </IconButton>

          <IconButton
            component={Link}
            href="/notifications"
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <Badge badgeContent={displayNotifCount} color="primary" max={99}>
              <Bell size={20} />
            </Badge>
          </IconButton>

          {isAuthenticated && user ? (
            <>
              <IconButton onClick={handleOpenMenu} sx={{ p: 0.5, border: '2px solid', borderColor: 'primary.main' }}>
                <Avatar
                  src={user.avatar_url}
                  alt={user.username}
                  sx={{ width: 34, height: 34 }}
                />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                sx={{
                  mt: 1.5,
                  '& .MuiPaper-root': {
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    minWidth: 200,
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {user.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {user.role}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { handleCloseMenu(); router.push('/sessions'); }}>
                  <Calendar size={16} style={{ marginRight: 10 }} /> My Sessions
                </MenuItem>
                <MenuItem onClick={() => { handleCloseMenu(); router.push('/profile'); }}>
                  <User size={16} style={{ marginRight: 10 }} /> View Profile
                </MenuItem>
                <MenuItem onClick={() => { handleCloseMenu(); router.push('/profile/edit'); }}>
                  <Settings size={16} style={{ marginRight: 10 }} /> Edit Profile
                </MenuItem>
                {user.role === 'ADMIN' && (
                  <MenuItem onClick={() => { handleCloseMenu(); router.push('/admin'); }}>
                    <Shield size={16} style={{ marginRight: 10 }} /> Admin Panel
                  </MenuItem>
                )}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                  <LogOut size={16} style={{ marginRight: 10 }} /> Log Out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              href="/login"
              variant="contained"
              color="primary"
              size="small"
              sx={{ fontWeight: 700 }}
            >
              Sign In
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
