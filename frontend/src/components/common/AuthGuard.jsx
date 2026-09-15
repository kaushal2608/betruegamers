'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Container, Card, CardContent, Stack, Chip } from '@mui/material';
import { ShieldAlert, Home, LogOut } from 'lucide-react';
import { logout } from '@/store/slices/authSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AuthGuard({ children, allowedRoles = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Public authentication routes should never be blocked
    if (
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/verify-otp')
    ) {
      return;
    }

    const cookieToken = Cookies.get('btg_token');
    const hasAuth = !!cookieToken || !!token || isAuthenticated;

    if (!hasAuth) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isClient, token, isAuthenticated, pathname, router]);

  // If on a public path, immediately render children without blocking
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-otp')
  ) {
    return children;
  }

  // Before hydration on client, show quick full-screen themed spinner
  if (!isClient) {
    return <LoadingSpinner fullScreen message="Securing connection..." />;
  }

  const cookieToken = Cookies.get('btg_token');
  const hasAuth = !!cookieToken || !!token || isAuthenticated;

  if (!hasAuth) {
    return <LoadingSpinner fullScreen message="Redirecting to login..." />;
  }

  // Check Role Permissions (e.g. /admin)
  if (allowedRoles && allowedRoles.length > 0) {
    const currentUser = user;

    // Wait if user profile is still loading from /auth/me before rejecting
    if (!currentUser) {
      return <LoadingSpinner message="Verifying role permissions..." />;
    }


    const userRole = currentUser?.role || 'USER';
    const hasRoleAccess = allowedRoles.includes(userRole);

    if (!hasRoleAccess) {
      return (
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3
          }}
        >
          <Container maxWidth="sm">
            <Card
              sx={{
                p: { xs: 3, sm: 5 },
                maxWidth: 520,
                width: '100%',
                textAlign: 'center',
                border: '1px solid',
                borderColor: 'error.main',
                bgcolor: 'background.paper'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'error.main'
                  }}
                >
                  <ShieldAlert size={38} color="#ef4444" />
                </Box>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 900,
                    color: 'text.primary',
                    mb: 1.5,
                    letterSpacing: '-0.02em'
                  }}
                >
                  Access Denied
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: 'error.main',
                    fontWeight: 700,
                    mb: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  You don't have access to view this page
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    mb: 3,
                    lineHeight: 1.6
                  }}
                >
                  This restricted sector requires{' '}
                  <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    {allowedRoles.join(' or ')}
                  </Box>{' '}
                  clearance. Your current account role is{' '}
                  <Chip
                    label={userRole}
                    size="small"
                    sx={{
                      bgcolor: 'action.selected',
                      color: 'text.primary',
                      fontWeight: 700,
                      ml: 0.5
                    }}
                  />
                  .
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  justifyContent="center"
                  sx={{ mt: 3 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Home size={18} />}
                    onClick={() => router.push('/home')}
                    sx={{ fontWeight: 700, px: 3 }}
                  >
                    Return to Home
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<LogOut size={18} />}
                    onClick={() => {
                      dispatch(logout());
                      router.push('/login');
                    }}
                    sx={{
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      fontWeight: 700,
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                  >
                    Switch Account
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Container>
        </Box>
      );
    }
  }

  return children;
}
