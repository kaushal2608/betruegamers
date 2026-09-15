'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Paper,
  useTheme
} from '@mui/material';
import {
  UserPlus,
  UserMinus,
  Check,
  MessageSquare,
  Trophy,
  Gamepad2,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { useGetUserByIdQuery, useGetUserGamesQuery } from '@/store/api/userApi';
import {
  useSendFriendRequestMutation,
  useCancelFriendRequestMutation,
  useGetFriendRequestsQuery,
  useGetFriendsQuery
} from '@/store/api/friendApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import useToast from '@/components/common/useToast';

export default function PublicPlayerProfilePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const params = useParams();
  const router = useRouter();
  const userId = params.id;
  const { showSuccess, showError } = useToast();

  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const { data: userGames, isLoading: isGamesLoading } = useGetUserGamesQuery(userId, { skip: !userId });
  const { data: friendRequestsData } = useGetFriendRequestsQuery();
  const { data: friendsData } = useGetFriendsQuery();

  const [sendFriendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();
  const [cancelFriendRequest, { isLoading: isCancelling }] = useCancelFriendRequestMutation();

  const [isActionPending, setIsActionPending] = useState(false);

  const friendsList = friendsData?.data || [];
  const outgoingRequests = friendRequestsData?.data?.outgoing || [];

  const isFriend = friendsList.some((f) => f.id === userId);
  const pendingSentRequest = outgoingRequests.find((req) => req.receiver_id === userId);

  const handleAddFriend = async () => {
    setIsActionPending(true);
    try {
      const res = await sendFriendRequest(userId).unwrap();
      showSuccess(res?.message || 'Friend request sent successfully!');
    } catch (err) {
      showError(err?.data?.message || 'Failed to send friend request');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUnsendRequest = async () => {
    setIsActionPending(true);
    try {
      const requestId = pendingSentRequest?.id || userId;
      const res = await cancelFriendRequest(requestId).unwrap();
      showSuccess(res?.message || 'Friend request un-sent successfully.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to cancel friend request');
    } finally {
      setIsActionPending(false);
    }
  };


  if (isUserLoading || isGamesLoading) {
    return <LoadingSpinner message="Loading player profile..." />;
  }

  const user = userData?.data;
  const games = userGames?.data || [];

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ color: '#ef4444', mb: 2 }}>
          Player Not Found
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/discover')}>
          Back to Discovery
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => router.back()}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        Back
      </Button>

      {/* Banner & Avatar Header */}
      <Card sx={{ mb: 4, overflow: 'hidden', position: 'relative' }}>
        <Box
          sx={{
            height: { xs: 160, sm: 220 },
            backgroundImage: `url(${user.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: isDark
                ? 'linear-gradient(180deg, rgba(8, 10, 15, 0.2) 0%, rgba(16, 20, 30, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0) 25%, rgba(255, 255, 255, 0.95) 100%)'
            }
          }}
        />

        <CardContent sx={{ pt: 0, pb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            sx={{ mt: { xs: -7, sm: -9 }, mb: 2 }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-end' }} spacing={2.5}>
              <Avatar
                src={user.avatar_url}
                alt={user.username}
                sx={{
                  width: { xs: 100, sm: 130 },
                  height: { xs: 100, sm: 130 },
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: (t) => t.palette.mode === 'dark' ? '0 0 25px rgba(0, 240, 255, 0.4)' : '0 0 25px rgba(2, 132, 199, 0.25)'
                }}
              />
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Stack direction="row" alignItems="center" spacing={1.5} justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ overflow: 'visible' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.35,
                      pt: '4px',
                      overflow: 'visible',
                      display: 'inline-block'
                    }}
                  >
                    {user.username}
                  </Typography>
                  <Chip
                    label={user.role || 'GAMER'}
                    size="small"
                    color={user.role === 'COACH' ? 'secondary' : 'primary'}
                    sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                  />
                </Stack>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {user.full_name || 'Competitive Gamer'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, sm: 0 } }}>
              {isFriend ? (
                <Button
                  variant="outlined"
                  disabled
                  startIcon={<Check size={18} />}
                  sx={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                >
                  Friends
                </Button>
              ) : pendingSentRequest ? (
                <Button
                  variant="outlined"
                  color="error"
                  disabled={isActionPending || isCancelling}
                  startIcon={<UserMinus size={18} />}
                  onClick={handleUnsendRequest}
                  sx={{ fontWeight: 700 }}
                >
                  {isActionPending || isCancelling ? 'Cancelling...' : 'Unsend Request'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={isActionPending || isSending}
                  startIcon={<UserPlus size={18} />}
                  onClick={handleAddFriend}
                  sx={{ fontWeight: 700 }}
                >
                  {isActionPending || isSending ? 'Sending...' : 'Add Friend'}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<MessageSquare size={18} />}
                onClick={() => router.push(`/chat?recipient=${user.id}`)}
              >
                Message
              </Button>
            </Stack>
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2, mb: 3, maxWidth: 800, lineHeight: 1.6 }}>
            {user.bio || 'Gamer on BeTrueGamers.'}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Social & Region Badges */}
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Trophy size={16} color="var(--mui-palette-primary-main, currentColor)" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Tier: <Typography component="span" variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>{user.experience_level || 'Intermediate'}</Typography>
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Globe size={16} color="var(--mui-palette-secondary-main, currentColor)" />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Region: <Typography component="span" variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>{user.country || 'Global'}</Typography>
              </Typography>
            </Stack>
            {user.discord_tag && (
              <Chip label={`Discord: ${user.discord_tag}`} size="small" sx={{ bgcolor: 'action.hover', color: '#7289da' }} />
            )}
            {user.riot_id && (
              <Chip label={`Riot: ${user.riot_id}`} size="small" sx={{ bgcolor: 'action.hover', color: '#eb0029' }} />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Games Played Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
          <Gamepad2 size={24} color="var(--mui-palette-primary-main, currentColor)" />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            GAMES PLAYED ({games.length})
          </Typography>
        </Stack>

        {games.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.card' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              This player has not publicly showcased any game titles yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {games.map((g) => (
              <Grid item xs={12} sm={6} md={4} key={g.id}>
                <Card sx={{ p: 2.5, bgcolor: 'background.card' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {g.game_name}
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Rank:</Typography>
                      <Chip label={g.in_game_rank} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Role:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{g.main_role}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Hours:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{g.hours_played} hrs</Typography>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
