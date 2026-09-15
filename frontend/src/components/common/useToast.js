'use client';

import { useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { showSnackbar, closeSnackbar } from '@/store/slices/uiSlice';

/**
 * Custom hook for triggering the platform's global snackbar
 */
export function useToast() {
  const dispatch = useDispatch();

  const showToast = useCallback((message, severity = 'info', autoHideDuration = 4000) => {
    dispatch(showSnackbar({ message, severity, autoHideDuration }));
  }, [dispatch]);

  const showSuccess = useCallback((message, autoHideDuration = 4000) => {
    dispatch(showSnackbar({ message, severity: 'success', autoHideDuration }));
  }, [dispatch]);

  const showError = useCallback((message, autoHideDuration = 5000) => {
    dispatch(showSnackbar({ message, severity: 'error', autoHideDuration }));
  }, [dispatch]);

  const showInfo = useCallback((message, autoHideDuration = 4000) => {
    dispatch(showSnackbar({ message, severity: 'info', autoHideDuration }));
  }, [dispatch]);

  const showWarning = useCallback((message, autoHideDuration = 4500) => {
    dispatch(showSnackbar({ message, severity: 'warning', autoHideDuration }));
  }, [dispatch]);

  const dismiss = useCallback(() => {
    dispatch(closeSnackbar());
  }, [dispatch]);

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    dismiss
  };
}

export default useToast;
