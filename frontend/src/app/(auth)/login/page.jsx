'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  useTheme
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
import { useLoginMutation } from '@/store/api/authApi';
import useToast from '@/components/common/useToast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function LoginForm() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess } = useToast();

  const redirectUrl = searchParams.get('redirect') || '/home';
  const initialEmail = searchParams.get('email') || '';
  const initialPassword = searchParams.get('password') || '';

  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({
    email: initialEmail,
    password: initialPassword
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setErrorMsg('');

    if (!formData.email || !formData.password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    try {
      const res = await login(formData).unwrap();
      if (res.success) {
        showSuccess(`Welcome back, ${res.data?.user?.username || 'Gamer'}!`);
        router.push(redirectUrl);
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '0.05em' }}>
            WELCOME <Box component="span" sx={{ color: 'primary.main' }}>BACK</Box>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your gaming credentials to enter the arena
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
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
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1.5 }}>
              <Typography
                component={Link}
                href={`/forgot-password${formData.email ? `?email=${encodeURIComponent(formData.email)}` : ''}`}
                sx={{ color: 'primary.main', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot Password?
              </Typography>
            </Box>

            <Button
              type="submit"
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
              startIcon={<LogIn size={18} />}
              sx={{ py: 1.5, fontSize: '1rem', mt: 1 }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Don&apos;t have an account yet?{' '}
            <Typography
              component={Link}
              href="/signup"
              sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Create Gamer Profile
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <LoginForm />
    </Suspense>
  );
}
