"use client";

import React, { useState } from "react";
import Grid from "@mui/material/Grid2";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/store/auth/authActions";
import { useRouter } from "next/navigation"; // Import useRouter
import { setSnackBar } from "@/store/app/appActions";

const Loginpage = () => {
  const dispatch = useDispatch();
  const router = useRouter(); // Initialize router
  const [loginData, setLoginData] = useState({
    password: "",
    email:"",
  });
  const count = useSelector(state => state.auth.UserData)

  const _login = (event) => {
    event.preventDefault(); 
    dispatch(login(loginData))
      .then((data) => {
        // console.log("status", data.data.data);
        router.push(`/dashboard`); // Redirect to dashboard
      })
      .catch((err) => {
        setLoginData({email:"", password:""});
        dispatch(
          setSnackBar(true, "error", err.message)
        );
        // console.log("error", err);
      });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target; // Destructure name and value from event.target
    setLoginData((prev) => ({
      ...prev,
      [name]: value, // Update the state with the new value for the given input name
    }));
  };
  
// console.log("check login values", count)

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
    <form onSubmit={_login}>
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
              name="email"
              value={loginData.email}
              label="Email"
              variant="outlined"
              type="email"
              autoComplete="email"
              size="small"
              InputProps={{
                sx: {
                  borderRadius: "8px",
                },
              }}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item size={12} columns={{ xs: 12, sm: 12, md: 12 }}>
            <TextField
              fullWidth
              required
              id="password"
              name="password"
              value={loginData?.password}
              label="Password"
              variant="outlined"
              type="password"
              autoComplete="current-password"
              size="small"
              InputProps={{
                sx: {
                  borderRadius: "8px",
                },
              }}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid item size={12} columns={{ xs: 12, sm: 12, md: 12 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              size="small"
              sx={{
                padding: "10px 0",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
              // onClick={_login}
            >
              Login
            </Button>
          </Grid>
        </Grid>
      </Paper>
      </form>
    </Box>
  );
};

export default Loginpage;
