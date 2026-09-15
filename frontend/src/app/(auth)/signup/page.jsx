'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  useTheme
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, User, UserCheck, Shield, Sparkles } from 'lucide-react';
import { useSignupMutation } from '@/store/api/authApi';

export default function SignupPage() {
  const theme = useTheme();
  const router = useRouter();
  const [signup, { isLoading }] = useSignupMutation();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'USER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleRoleChange = (event, newRole) => {
    if (newRole !== null) {
      setFormData((prev) => ({ ...prev, role: newRole }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await signup(formData).unwrap();
      if (res.success) {
        // Save pending signup data in sessionStorage for OTP verification
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_signup', JSON.stringify(formData));
        }
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Registration failed. Please verify your details.');
    }
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '0.05em' }}>
            JOIN <Box component="span" sx={{ color: 'primary.main' }}>BETRUEGAMERS</Box>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Build your identity, find teammates, and book radiant coaching
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mb: 1, display: 'block' }}>
                I AM JOINING PRIMARILY AS:
              </Typography>
              <ToggleButtonGroup
                value={formData.role}
                exclusive
                onChange={handleRoleChange}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    py: 1.2,
                    fontWeight: 700,
                    '&.Mui-selected': {
                      bgcolor: isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                      color: 'primary.main',
                      borderColor: 'primary.main'
                    }
                  }
                }}
              >
                <ToggleButton value="USER">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <User size={18} />
                    <span>Gamer / Player</span>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="COACH">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Shield size={18} />
                    <span>Coach / Pro</span>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              label="Email Address"
              name="email"
              type="email"
              required
              fullWidth
              value={formData.email}
              onChange={handleChange}
              placeholder="gamer@example.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <Mail size={18} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Gaming Username / Tag"
              name="username"
              type="text"
              required
              fullWidth
              value={formData.username}
              onChange={handleChange}
              placeholder="ViperStrike99"
              helperText="Only letters, numbers, and underscores (3-30 characters)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <UserCheck size={18} />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <Lock size={18} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              startIcon={<Sparkles size={18} />}
              sx={{ py: 1.5, fontSize: '1rem', mt: 1 }}
            >
              {isLoading ? 'Creating Profile...' : 'Send Verification OTP'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Already have an account?{' '}
            <Typography
              component={Link}
              href="/login"
              sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Sign In
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
