'use client';

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
  Paper,
  Rating,
  useTheme
} from '@mui/material';
import {
  Sparkles,
  Gamepad2,
  Users,
  Shield,
  MessageSquare,
  ArrowRight,
  Tv,
  Star,
  Clock
} from 'lucide-react';
import { useGetCoachesQuery } from '@/store/api/coachApi';
import { useGetGamesQuery } from '@/store/api/gameApi';
import { useGetFriendsQuery } from '@/store/api/friendApi';
import { useGetUserSessionsQuery } from '@/store/api/coachingApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DashboardHomePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useSelector((state) => state.auth);

  const { data: coachesData, isLoading: isCoachesLoading } = useGetCoachesQuery({ limit: 4 });
  const { data: gamesData, isLoading: isGamesLoading } = useGetGamesQuery({ limit: 4 });
  const { data: friendsData } = useGetFriendsQuery(undefined, { skip: !user });
  const { data: sessionsData } = useGetUserSessionsQuery(undefined, { skip: !user });

  const coaches = (coachesData?.data || []).filter((c) => c.user_id !== user?.id);
  const games = gamesData?.data || [];
  const friends = friendsData?.data || [];
  const sessions = sessionsData?.data || [];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 4,
          p: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          background: isDark
            ? 'linear-gradient(135deg, rgba(16, 20, 30, 0.95) 0%, rgba(20, 27, 45, 0.9) 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(0, 240, 255, 0.25)' : 'rgba(2, 132, 199, 0.25)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(2, 132, 199, 0.08)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Sparkles size={20} color={theme.palette.primary.main} />
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
                PLAYER DASHBOARD
              </Typography>
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
              WELCOME BACK, <Box component="span" sx={{ color: 'primary.main' }}>{user?.username || 'GAMER'}</Box>
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650 }}>
              Ready to climb the ladder? Check your coaching schedule, jump into live screen-sharing sessions, or discover radiant coaches.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              component={Link}
              href="/discover"
              variant="contained"
              color="primary"
              startIcon={<Users size={18} />}
              sx={{ py: 1.2, px: 2.5 }}
            >
              Find Teammates
            </Button>
            <Button
              component={Link}
              href="/coaches"
              variant="outlined"
              startIcon={<Shield size={18} />}
              sx={{ py: 1.2, px: 2.5, borderColor: 'divider', color: 'text.primary' }}
            >
              Explore Coaches
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Grid container spacing={4}>
        {/* Left Column: Popular Games & Recommended Coaches */}
        <Grid item xs={12} lg={8}>
          {/* Active Coaching Sessions */}
          {sessions.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={20} color={theme.palette.primary.main} />
                YOUR COACHING SESSIONS
              </Typography>
              <Stack spacing={2}>
                {sessions.slice(0, 3).map((s) => (
                  <Card key={s.id} sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {s.game_name} with {s.coach_username || 'Coach'}
                        </Typography>
                        <Chip
                          label={s.status}
                          size="small"
                          color={s.status === 'LIVE' ? 'success' : s.status === 'ACCEPTED' ? 'primary' : 'default'}
                          sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Duration: {s.duration_minutes} mins {s.goals && `• Goal: ${s.goals}`}
                      </Typography>
                    </Box>
                    <Button
                      component={Link}
                      href={`/coaching/${s.id}`}
                      variant={s.status === 'LIVE' ? 'contained' : 'outlined'}
                      color={s.status === 'LIVE' ? 'success' : 'primary'}
                      startIcon={<Tv size={16} />}
                      size="small"
                    >
                      {s.status === 'LIVE' ? 'Join Live Stream' : 'Session Room'}
                    </Button>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Recommended Coaches */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield size={22} color={theme.palette.primary.main} />
                RECOMMENDED PRO COACHES
              </Typography>
              <Button component={Link} href="/coaches" endIcon={<ArrowRight size={16} />} size="small" sx={{ color: 'primary.main', fontWeight: 700 }}>
                View All
              </Button>
            </Stack>

            {isCoachesLoading ? (
              <LoadingSpinner message="Finding top coaches..." size={36} />
            ) : coaches.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.card' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No coaches currently available.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2.5}>
                {coaches.map((c) => (
                  <Grid item xs={12} sm={6} key={c.id}>
                    <Card sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                          <Avatar src={c.avatar_url} alt={c.username} sx={{ width: 50, height: 50, border: '2px solid', borderColor: 'primary.main' }} />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {c.username}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Rating value={parseFloat(c.rating_avg) || 5} precision={0.1} readOnly size="small" sx={{ color: 'accent.yellow' }} />
                              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {c.rating_avg}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                ({c.review_count} reviews)
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.headline}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip label={c.game_name || 'Esports'} size="small" sx={{ bgcolor: 'action.selected', color: 'primary.main', fontWeight: 700 }} />
                          <Chip label={`$${c.hourly_rate_usd}/hr`} size="small" sx={{ bgcolor: 'action.hover', fontWeight: 700 }} />
                        </Stack>
                      </Box>
                      <Button
                        component={Link}
                        href={`/coaches/${c.id}`}
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="small"
                        sx={{ fontWeight: 700 }}
                      >
                        Book Session
                      </Button>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Popular Games Quick Access */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Gamepad2 size={22} color="var(--mui-palette-secondary-main, currentColor)" />
                POPULAR ARENAS
              </Typography>
              <Button component={Link} href="/games" endIcon={<ArrowRight size={16} />} size="small" sx={{ color: 'primary.main', fontWeight: 700 }}>
                Browse All
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {games.map((game) => (
                <Grid item xs={6} sm={3} key={game.id}>
                  <Card
                    component={Link}
                    href={`/games/${game.slug}`}
                    sx={{
                      display: 'block',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      '&:hover img': { transform: 'scale(1.1)' }
                    }}
                  >
                    <Box sx={{ height: 110, overflow: 'hidden', position: 'relative' }}>
                      <Box
                        component="img"
                        src={game.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'}
                        alt={game.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80';
                        }}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      />
                    </Box>
                    <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {game.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        {/* Right Column: Friends Online & Quick Chat */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 3, mb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Users size={20} color="#10b981" />
                FRIENDS ({friends.length})
              </Typography>
              <Button component={Link} href="/friends" size="small" color="primary">
                Manage
              </Button>
            </Stack>

            {friends.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  No friends added yet.
                </Typography>
                <Button component={Link} href="/discover" variant="outlined" size="small" color="primary">
                  Discover Gamers
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {friends.slice(0, 5).map((f) => (
                  <Paper
                    key={f.id}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      bgcolor: 'background.card'
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={f.avatar_url} alt={f.username} sx={{ width: 36, height: 36 }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {f.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {f.experience_level || 'Gamer'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      component={Link}
                      href={`/chat?recipient=${f.id}`}
                      size="small"
                      startIcon={<MessageSquare size={14} />}
                      sx={{ color: 'primary.main' }}
                    >
                      Chat
                    </Button>
                  </Paper>
                ))}
              </Stack>
            )}
          </Card>

          {/* Quick Arena Screen Share Callout */}
          <Card
            sx={{
              p: 3,
              background: isDark
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 240, 255, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(2, 132, 199, 0.1) 100%)',
              border: '1px solid',
              borderColor: isDark ? 'rgba(0, 240, 255, 0.3)' : 'rgba(2, 132, 199, 0.25)'
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Tv size={24} color={theme.palette.primary.main} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                LIVE SCREEN SHARE
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
              Jump into the live coaching room to experience real-time gameplay sharing with ultra-low latency audio and crystal-clear 1080p 60fps streaming.
            </Typography>
            <Button
              component={Link}
              href="/coaching/live-arena"
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Tv size={18} />}
              sx={{ fontWeight: 800 }}
            >
              Enter Live Arena
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
