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
  IconButton,
  useTheme
} from '@mui/material';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/authApi';
import useToast from '@/components/common/useToast';
import LoadingSpinner from '@/components/common/LoadingSpinner';

function ForgotPasswordContent() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const { showSuccess } = useToast();

  const [step, setStep] = useState(1); // 1: enter email, 2: enter otp & new password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [requestReset, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    try {
      const res = await requestReset({ email: trimmedEmail }).unwrap();
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to send reset code. Please check your email.');
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await requestReset({ email: email.trim() }).unwrap();
      setSuccessMsg('A new reset code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to resend code.');
    }
  };

  // Step 2: Submit OTP & new password
  const handleResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (otp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      }).unwrap();

      showSuccess('Password reset successfully! You can now sign in.');
      setSuccessMsg(res.message || 'Password reset successful! Redirecting...');
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(email.trim())}`);
      }, 1500);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Password reset failed. Please check the code and try again.');
    }
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: step === 1
                ? isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.1)'
                : isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(217, 119, 6, 0.1)',
              border: '1px solid',
              borderColor: step === 1 ? 'primary.main' : 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}
          >
            {step === 1 ? (
              <Mail size={26} color={theme.palette.primary.main} />
            ) : (
              <ShieldCheck size={26} color={theme.palette.warning.main} />
            )}
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '0.05em' }}>
            {step === 1 ? 'FORGOT ' : 'RESET '}
            <Box component="span" sx={{ color: step === 1 ? 'primary.main' : 'warning.main' }}>PASSWORD</Box>
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {step === 1
              ? 'Enter your registered email and we will send you an OTP to reset your password'
              : `Enter the 6-digit code sent to ${email} and choose a new password`}
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

        {step === 1 ? (
          /* STEP 1: Enter Email */
          <Box component="form" onSubmit={handleRequestOtp} noValidate>
            <Stack spacing={3}>
              <TextField
                label="Registered Email Address"
                name="email"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="gamer@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      <Mail size={18} />
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={isRequesting || !email.trim()}
                startIcon={<Send size={18} />}
                sx={{ py: 1.5, fontSize: '1rem' }}
              >
                {isRequesting ? 'Sending Code...' : 'Send Verification OTP'}
              </Button>
            </Stack>
          </Box>
        ) : (
          /* STEP 2: Enter OTP & New Password */
          <Box component="form" onSubmit={handleResetPassword} noValidate>
            <Stack spacing={2.5}>
              <TextField
                label="6-Digit Reset Code"
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
                    fontSize: '1.6rem',
                    letterSpacing: '0.25em',
                    fontWeight: 800,
                    color: theme.palette.warning.main
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

              <TextField
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      <Lock size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: 'text.secondary' }}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                disabled={isResetting || otp.length !== 6 || !newPassword || !confirmPassword}
                startIcon={<CheckCircle2 size={18} />}
                sx={{ py: 1.5, fontSize: '1rem', mt: 1 }}
              >
                {isResetting ? 'Updating Password...' : 'Reset Password & Save'}
              </Button>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                <Button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isRequesting}
                  size="small"
                  startIcon={<RotateCcw size={14} />}
                  sx={{ color: resendCooldown > 0 ? 'text.secondary' : 'primary.main', fontWeight: 600 }}
                >
                  {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
                </Button>

                <Button
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  size="small"
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Change Email
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography
            component={Link}
            href="/login"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.8,
              '&:hover': { color: 'text.primary' }
            }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
