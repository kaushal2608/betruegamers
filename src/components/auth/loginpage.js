"use client";

import React from "react";
import Grid from "@mui/material/Grid2";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

const Loginpage = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f4f8", // Light background color
        backgroundImage: `url('/bagimg.jpg')`, // Set your image path here
        backgroundSize: "cover", // Ensure the image covers the entire background
        backgroundPosition: "center", // Center the background image
        backgroundRepeat: "no-repeat", // Prevent repeating the image
      }}
    >
      <Paper 
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: "400px",
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "10px",
        }}
      >
        <Typography variant="h5" component="h1" align="center" gutterBottom>
          Login
        </Typography>
        
        <Grid container spacing={2} >
          <Grid item size={12} columns={{ xs: 12, sm: 12, md: 12 }}>
            <TextField
              fullWidth
              required
              id="email"
              label="Email"
              variant="outlined"
              type="email"
              autoComplete="email"
              InputProps={{
                sx: {
                  borderRadius: "8px",
                },
              }}
            />
          </Grid>

          <Grid item size={12} columns={{ xs: 12, sm: 12, md: 12 }}>
            <TextField
              fullWidth
              required
              id="password"
              label="Password"
              variant="outlined"
              type="password"
              autoComplete="current-password"
              InputProps={{
                sx: {
                  borderRadius: "8px",
                },
              }}
            />
          </Grid>

          <Grid item size={12} columns={{ xs: 12, sm: 12, md: 12 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{
                padding: "10px 0",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Login
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Loginpage;
