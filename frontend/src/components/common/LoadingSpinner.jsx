'use client';

import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingSpinner({ message = 'Loading...', size = 48, fullScreen = false }) {
  return (
    <Box
      className={fullScreen ? 'btg-loading-screen' : ''}
      data-loading-screen={fullScreen ? 'true' : 'false'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: fullScreen ? '100vh' : '200px',
        height: fullScreen ? '100vh' : 'auto',
        bgcolor: fullScreen ? 'background.default' : 'transparent',
        color: 'text.primary',
        p: 3,
        boxSizing: 'border-box'
      }}
    >
      <CircularProgress
        size={size}
        sx={{
          color: 'primary.main',
          filter: (theme) =>
            theme.palette.mode === 'dark'
              ? 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))'
              : 'drop-shadow(0 0 8px rgba(2, 132, 199, 0.4))',
          mb: 2
        }}
      />
      {message && (
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, letterSpacing: '0.05em' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
