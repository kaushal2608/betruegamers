"use client"
import { setSnackBar } from '@/store/app/appActions';
import { Alert, Snackbar } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

const GlobalSnackbar = () => {
  const dispatch = useDispatch();
  const {snackbarOpen, snackbarType, snackbarMessage} = useSelector(state => state.app.snackBar)

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setSnackBar(false, "",  ""));
  };

  return (
    <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
      <Alert
        onClose={handleClose}
        severity={snackbarType}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );
};

export default GlobalSnackbar;
