'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, Slide, useTheme } from '@mui/material';
import { closeSnackbar } from '@/store/slices/uiSlice';

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

export default function GlobalSnackbar() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { snackbar } = useSelector((state) => state.ui) || {};

  const { open = false, message = '', severity = 'info', autoHideDuration = 4000 } = snackbar || {};

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    dispatch(closeSnackbar());
  };

  const isDark = theme.palette.mode === 'dark';

  const getSeverityBorder = () => {
    switch (severity) {
      case 'success':
        return `1px solid ${theme.palette.primary.main}`;
      case 'error':
        return `1px solid ${theme.palette.error.main}`;
      case 'warning':
        return `1px solid ${theme.palette.warning.main}`;
      case 'info':
      default:
        return `1px solid ${theme.palette.secondary.main}`;
    }
  };

  const getSeverityGlow = () => {
    switch (severity) {
      case 'success':
        return isDark ? '0 8px 30px rgba(0, 240, 255, 0.35)' : '0 6px 20px rgba(2, 132, 199, 0.2)';
      case 'error':
        return '0 8px 30px rgba(239, 68, 68, 0.25)';
      case 'warning':
        return '0 8px 30px rgba(245, 158, 11, 0.25)';
      case 'info':
      default:
        return isDark ? '0 8px 30px rgba(139, 92, 246, 0.35)' : '0 6px 20px rgba(124, 58, 237, 0.2)';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{
        top: { xs: 20, sm: 28 },
        zIndex: 9999
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{
          minWidth: { xs: '90vw', sm: 360 },
          maxWidth: 550,
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.92rem',
          backdropFilter: 'blur(16px)',
          border: getSeverityBorder(),
          boxShadow: getSeverityGlow(),
          bgcolor: isDark ? 'rgba(10, 14, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          color: 'text.primary',
          '& .MuiAlert-icon': {
            alignItems: 'center',
            fontSize: '1.4rem'
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
