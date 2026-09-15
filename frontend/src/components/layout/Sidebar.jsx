'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme
} from '@mui/material';
import {
  Home,
  Compass,
  Gamepad2,
  Shield,
  Users,
  MessageSquare,
  Bell,
  User,
  Tv,
  LayoutDashboard,
  Calendar
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home Feed', path: '/home', icon: Home },
  { label: 'Discover', path: '/discover', icon: Compass },
  { label: 'Games', path: '/games', icon: Gamepad2 },
  { label: 'Coaches', path: '/coaches', icon: Shield },
  { label: 'Sessions', path: '/sessions', icon: Calendar },
  { label: 'Friends', path: '/friends', icon: Users },
  { label: 'Chat', path: '/chat', icon: MessageSquare },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'My Profile', path: '/profile', icon: User }
];

export default function Sidebar() {
  const theme = useTheme();
  const pathname = usePathname();
  const { isSidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const isDark = theme.palette.mode === 'dark';
  const drawerWidth = 240;

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isSidebarOpen}
      sx={{
        width: isSidebarOpen ? drawerWidth : 0,
        flexShrink: 0,
        transition: 'width 0.2s ease',
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: 68,
          height: 'calc(100vh - 68px)',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
          px: 1.5,
          py: 2
        }
      }}
    >
      <Box sx={{ mb: 2, px: 1.5 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.1em' }}>
          PLATFORM NAVIGATION
        </Typography>
      </Box>

      <List disablePadding>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path));

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: '8px',
                  py: 1,
                  px: 1.5,
                  bgcolor: isActive
                    ? isDark
                      ? 'rgba(0, 240, 255, 0.12)'
                      : 'rgba(2, 132, 199, 0.12)'
                    : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  border: '1px solid',
                  borderColor: isActive
                    ? isDark
                      ? 'rgba(0, 240, 255, 0.3)'
                      : 'rgba(2, 132, 199, 0.3)'
                    : 'transparent',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    color: 'text.primary'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                  <Icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.92rem',
                    fontWeight: isActive ? 700 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 2, borderColor: 'divider' }} />

      {/* Live Coaching Quick Session Link */}
      <Box sx={{ p: 1 }}>
        <ListItemButton
          component={Link}
          href="/coaching/live-arena"
          sx={{
            borderRadius: '8px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 240, 255, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(2, 132, 199, 0.12) 100%)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(2, 132, 199, 0.25)',
            color: 'text.primary',
            py: 1.2,
            px: 1.5,
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: isDark
                ? '0 0 15px rgba(0, 240, 255, 0.25)'
                : '0 4px 15px rgba(2, 132, 199, 0.2)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
            <Tv size={20} />
          </ListItemIcon>
          <ListItemText
            primary="Live Arena"
            secondary="Live Screen Share"
            primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 800 }}
            secondaryTypographyProps={{ fontSize: '0.72rem', color: 'text.secondary' }}
          />
        </ListItemButton>
      </Box>

      {/* Admin Panel Link */}
      {user?.role === 'ADMIN' && (
        <Box sx={{ mt: 'auto', p: 1 }}>
          <ListItemButton
            component={Link}
            href="/admin"
            sx={{
              borderRadius: '8px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'accent.main',
              color: 'accent.main',
              py: 1,
              px: 1.5
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'accent.main' }}>
              <LayoutDashboard size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Admin Panel"
              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 800 }}
            />
          </ListItemButton>
        </Box>
      )}
    </Drawer>
  );
}
