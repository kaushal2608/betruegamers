'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Grid,
  Chip,
  Stack,
  Divider,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Shield,
  Star,
  Tv,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Award
} from 'lucide-react';
import { useGetCoachByIdQuery } from '@/store/api/coachApi';
import { useRequestSessionMutation } from '@/store/api/coachingApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useToast from '@/components/common/useToast';

export default function CoachDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id;
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { showSuccess, showError } = useToast();

  const { data: coachData, isLoading } = useGetCoachByIdQuery(coachId, { skip: !coachId });
  const [requestSession, { isLoading: isBooking }] = useRequestSessionMutation();

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [goals, setGoals] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0, 0, 0);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  });
  const [bookingFeedback, setBookingFeedback] = useState({ error: '', success: '' });

  const minDateTime = useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }, []);

  // Set default game when coach loads
  useEffect(() => {
    if (coachData?.data?.games?.length > 0 && !selectedGameId) {
      setSelectedGameId(coachData.data.games[0].game_id);
    }
  }, [coachData, selectedGameId]);

  if (isLoading) {
    return <LoadingSpinner message="Loading coach profile..." />;
  }

  const coach = coachData?.data;

  if (!coach) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ color: '#ef4444', mb: 2 }}>
          Coach Profile Not Found
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/coaches')}>
          Back to Coaches
        </Button>
      </Box>
    );
  }

  const handleOpenBooking = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/coaches/${coachId}`);
      return;
    }
    if (coach.games?.length > 0 && !selectedGameId) {
      setSelectedGameId(coach.games[0].game_id);
    }
    setBookingDialogOpen(true);
  };

  const handleConfirmBooking = async () => {
    if (!scheduledDate) {
      showError('Please select a date and time for your coaching session.');
      return;
    }
    setBookingFeedback({ error: '', success: '' });
    try {
      const res = await requestSession({
        coachId: coach.id,
        gameId: selectedGameId || coach.games?.[0]?.game_id,
        durationMinutes: sessionDuration,
        goals: goals.trim(),
        scheduledAt: new Date(scheduledDate).toISOString()
      }).unwrap();

      if (res.success) {
        showSuccess('Session request sent! Awaiting coach approval.');
        setBookingFeedback({
          success: 'Session requested! Your coach will review and approve it. Redirecting to Sessions...',
          error: ''
        });
        setTimeout(() => {
          setBookingDialogOpen(false);
          router.push('/sessions');
        }, 1200);
      }
    } catch (err) {
      showError(err?.data?.message || 'Failed to request session');
      setBookingFeedback({ error: err?.data?.message || 'Failed to request session', success: '' });
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => router.push('/coaches')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        All Coaches
      </Button>

      {/* Hero Coach Card */}
      <Card sx={{ p: 4, mb: 4, position: 'relative' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm="auto">
            <Avatar
              src={coach.avatar_url}
              alt={coach.username}
              sx={{
                width: 110,
                height: 110,
                border: '3px solid',
                borderColor: 'secondary.main',
                boxShadow: (t) => t.palette.mode === 'dark' ? '0 0 25px rgba(139, 92, 246, 0.4)' : '0 0 25px rgba(124, 58, 237, 0.25)'
              }}
            />
          </Grid>

          <Grid item xs={12} sm>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {coach.username}
              </Typography>
              {coach.is_verified && (
                <Chip
                  icon={<CheckCircle2 size={16} color="currentColor" />}
                  label="VERIFIED PRO"
                  size="small"
                  sx={{ bgcolor: 'action.selected', color: 'primary.main', fontWeight: 800 }}
                />
              )}
            </Stack>

            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
              {coach.headline}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Rating value={parseFloat(coach.rating_avg) || 5} precision={0.1} readOnly size="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, ml: 0.5 }}>
                  {coach.rating_avg}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ({coach.review_count} verified reviews)
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
              <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
                {coach.coaching_experience_years} Years Coaching Experience
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>•</Typography>
              <Typography variant="caption" sx={{ color: 'accent.emerald', fontWeight: 700 }}>
                {coach.total_sessions_completed} Sessions Completed
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} sm="auto" sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary' }}>
              ${coach.hourly_rate_usd}
              <Box component="span" sx={{ fontSize: '0.9rem', color: 'text.secondary', fontWeight: 500 }}> / hr</Box>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Tv size={18} />}
              onClick={handleOpenBooking}
              sx={{ mt: 2, py: 1.4, px: 3, fontWeight: 800 }}
            >
              Book Live Coaching
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Bio & Methodology */}
      <Card sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          ABOUT THIS COACH & METHODOLOGY
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {coach.bio}
        </Typography>
      </Card>

      {/* Games & Specializations */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2.5 }}>
          COACHED GAMES & HIGHEST RANKS
        </Typography>
        <Grid container spacing={3}>
          {coach.games?.map((g) => (
            <Grid item xs={12} sm={6} key={g.id}>
              <Card sx={{ p: 3, bgcolor: 'background.card' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                  {g.game_name}
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Peak Rank:</Typography>
                    <Chip label={g.highest_rank} size="small" sx={{ bgcolor: 'action.selected', color: 'primary.main', fontWeight: 700 }} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Focus Area:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{g.specialization || 'Tactical Strategy & Macro'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Session Format:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{g.session_duration_minutes}m Live Screen Stream</Typography>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Reviews Section */}
      <Card sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
          VERIFIED STUDENT REVIEWS ({coach.reviews?.length || 0})
        </Typography>

        {coach.reviews?.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No reviews yet for this coach.
          </Typography>
        ) : (
          <Stack spacing={3}>
            {coach.reviews?.map((r) => (
              <Box key={r.id} sx={{ pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Avatar src={r.gamer_avatar} sx={{ width: 32, height: 32 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {r.gamer_username || 'Verified Student'}
                  </Typography>
                  <Rating value={r.rating} readOnly size="small" />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                  {r.review_text}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      {/* Booking Dialog */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => setBookingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid rgba(0, 240, 255, 0.3)' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Book 1-on-1 Session with {coach.username}
        </DialogTitle>
        <DialogContent>
          {bookingFeedback.error && (
            <Alert severity="error" sx={{ mb: 2 }}>{bookingFeedback.error}</Alert>
          )}
          {bookingFeedback.success && (
            <Alert severity="success" sx={{ mb: 2 }}>{bookingFeedback.success}</Alert>
          )}

          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Game For Coaching"
              fullWidth
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
            >
              {coach.games?.map((g) => (
                <MenuItem key={g.game_id} value={g.game_id}>
                  {g.game_name} ({g.highest_rank})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Session Duration"
              select
              fullWidth
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
            >
              <MenuItem value={60}>60 Minutes (${coach.hourly_rate_usd})</MenuItem>
              <MenuItem value={90}>90 Minutes (${(coach.hourly_rate_usd * 1.5).toFixed(0)})</MenuItem>
              <MenuItem value={120}>120 Minutes (${(coach.hourly_rate_usd * 2).toFixed(0)})</MenuItem>
            </TextField>

            <TextField
              label="Session Date & Time"
              type="datetime-local"
              fullWidth
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              inputProps={{ min: minDateTime }}
              InputLabelProps={{ shrink: true }}
              helperText="Select when you would like to schedule this coaching session."
              sx={{
                '& input': { colorScheme: 'dark' }
              }}
            />

            <TextField
              label="Goals or Specific Focus Areas"
              multiline
              rows={3}
              fullWidth
              placeholder="e.g. Aim training, crosshair placement, clutch decision making, VOD review..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBookingDialogOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            variant="contained"
            color="primary"
            disabled={isBooking}
            sx={{ fontWeight: 800 }}
          >
            {isBooking ? 'Creating Session...' : 'Confirm & Request Session'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
