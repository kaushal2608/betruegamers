'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  useTheme
} from '@mui/material';
import { KeyRound, CheckCircle2, RotateCcw } from 'lucide-react';
import { useVerifyOtpMutation, useResendOtpMutation } from '@/store/api/authApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function VerifyOtpContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState(emailParam);
  const [pendingData, setPendingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('pending_signup');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPendingData(parsed);
          if (!email && parsed.email) {
            setEmail(parsed.email);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [email]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pendingData) {
      setErrorMsg('Signup session expired. Please return to signup.');
      return;
    }

    try {
      const res = await verifyOtp({
        email: pendingData.email,
        username: pendingData.username,
        password: pendingData.password,
        role: pendingData.role,
        otp: otp.trim()
      }).unwrap();

      if (res.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pending_signup');
        }
        setSuccessMsg('Account verified successfully! Setting up your profile...');
        setTimeout(() => {
          router.push('/onboarding/avatar');
        }, 1000);
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Verification failed. Please check your 6-digit code.');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setErrorMsg('');
    try {
      await resendOtp({ email }).unwrap();
      setSuccessMsg('A fresh verification code has been dispatched to your email.');
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend code.');
    }
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)',
              border: '1px solid',
              borderColor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            <KeyRound size={28} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '0.05em' }}>
            VERIFY <Box component="span" sx={{ color: 'primary.main' }}>YOUR EMAIL</Box>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            We sent a 6-digit verification code to:
          </Typography>
          <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mt: 0.5 }}>
            {email || 'your email'}
          </Typography>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleVerify}>
          <Stack spacing={3}>
            <TextField
              label="6-Digit Verification Code"
              name="otp"
              type="text"
              required
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  letterSpacing: '0.3em',
                  fontWeight: 800,
                  color: theme.palette.primary.main
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                    <KeyRound size={20} />
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isVerifying || otp.length !== 6}
              startIcon={<CheckCircle2 size={18} />}
              sx={{ py: 1.6, fontSize: '1rem' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isResending}
            size="small"
            startIcon={<RotateCcw size={15} />}
            sx={{ color: resendCooldown > 0 ? 'text.secondary' : 'primary.main', fontWeight: 600 }}
          >
            {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
          </Button>

          <Typography
            component={Link}
            href="/signup"
            sx={{ color: 'text.secondary', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}
          >
            Change Details
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <VerifyOtpContent />
    </Suspense>
  );
}
