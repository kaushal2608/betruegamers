'use client';

import React from 'react';
import Cookies from 'js-cookie';

import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import AuthGuard from '@/components/common/AuthGuard';
import SocketManager from '@/components/common/SocketManager';
import { useGetMeQuery } from '@/store/api/authApi';

export default function MainLayout({ children }) {
  const { isSidebarOpen } = useSelector((state) => state.ui);
  // Auto-fetch user session if token is in cookies
  useGetMeQuery(undefined, {
    skip: typeof window === 'undefined' || !Cookies.get('btg_token')
  });


  const sidebarWidth = isSidebarOpen ? 240 : 0;

  return (
    <AuthGuard>
      <SocketManager />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box sx={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3, md: 4 },
              width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
              transition: 'width 0.2s ease',
              minHeight: 'calc(100vh - 68px)',
              overflowX: 'hidden',
              color: 'text.primary'
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
