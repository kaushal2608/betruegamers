'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Container, Stack, Typography, IconButton, Tooltip, useTheme } from '@mui/material';
import { Gamepad2, Sun, Moon } from 'lucide-react';
import { toggleThemeMode } from '@/store/slices/uiSlice';

export default function AuthLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only redirect if user has an active, authenticated session
    if (isAuthenticated && token) {
      router.replace('/home');
    }
  }, [isAuthenticated, token, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.1) 0%, rgba(139, 92, 246, 0.05) 30%, rgba(8, 10, 15, 1) 70%)'
          : 'radial-gradient(circle at 50% 0%, rgba(2, 132, 199, 0.08) 0%, rgba(124, 58, 237, 0.04) 30%, rgba(248, 250, 252, 1) 70%)'
      }}
    >
      <Box
        sx={{
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(8, 10, 15, 0.7)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5} component={Link} href="/" sx={{ textDecoration: 'none', width: 'fit-content' }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDark ? '0 0 12px rgba(0, 240, 255, 0.5)' : '0 2px 10px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Gamepad2 size={20} color={theme.palette.primary.contrastText} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.05em' }}>
                BE<span style={{ color: theme.palette.primary.main }}>TRUE</span>GAMERS
              </Typography>
            </Stack>

            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={() => dispatch(toggleThemeMode())}
                sx={{
                  color: isDark ? '#eab308' : '#0284c7',
                  bgcolor: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 0.8,
                  borderRadius: '8px'
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="sm">
          {children}
        </Container>
      </Box>
    </Box>
  );
}
