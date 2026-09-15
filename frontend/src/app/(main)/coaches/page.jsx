'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Rating,
  useTheme
} from '@mui/material';
import { Search, Shield, Star, Tv, ArrowRight } from 'lucide-react';
import { useGetCoachesQuery } from '@/store/api/coachApi';
import { useGetGamesQuery } from '@/store/api/gameApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useSelector } from 'react-redux';

function CoachesListContent() {
  const searchParams = useSearchParams();
  const gameParam = searchParams.get('game') || '';
  const { user } = useSelector((state) => state.auth);

  const [selectedGame, setSelectedGame] = useState(gameParam);
  const [minRating, setMinRating] = useState('0');

  const { data: coachesData, isLoading } = useGetCoachesQuery({
    game: selectedGame || undefined,
    rating: minRating !== '0' ? minRating : undefined
  });
  const { data: gamesData } = useGetGamesQuery();

  const coaches = (coachesData?.data || []).filter((c) => c.user_id !== user?.id);
  const games = gamesData?.data || [];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
          VERIFIED ESPORTS MENTORS
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, mb: 1, color: 'text.primary' }}>
          FIND A PRO COACH
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Schedule live 1-on-1 coaching sessions with real-time screen sharing and tailored gameplay reviews
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2.5, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            select
            label="Game"
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All Games</MenuItem>
            {games.map((g) => (
              <MenuItem key={g.id} value={g.name}>{g.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Minimum Rating"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="0">Any Rating</MenuItem>
            <MenuItem value="4.5">4.5+ Stars</MenuItem>
            <MenuItem value="4.8">4.8+ Stars</MenuItem>
            <MenuItem value="5.0">5.0 Stars</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {/* Coaches Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading elite coaches..." />
      ) : coaches.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No coaches match your filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {coaches.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar src={c.avatar_url} alt={c.username} sx={{ width: 60, height: 60, border: '2px solid', borderColor: 'secondary.main' }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {c.username}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Rating value={parseFloat(c.rating_avg) || 5} precision={0.1} readOnly size="small" sx={{ color: 'accent.yellow' }} />
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {c.rating_avg}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          ({c.review_count} reviews)
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>

                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                    {c.headline}
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.bio}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    <Chip label={c.game_name || 'Multi-Game'} size="small" sx={{ bgcolor: 'action.selected', color: 'secondary.main', fontWeight: 700 }} />
                    <Chip label={`$${c.hourly_rate_usd}/hr`} size="small" sx={{ bgcolor: 'action.hover', fontWeight: 700 }} />
                  </Stack>
                </Box>

                <Button
                  component={Link}
                  href={`/coaches/${c.id}`}
                  variant="contained"
                  color="primary"
                  fullWidth
                  endIcon={<ArrowRight size={18} />}
                  sx={{ py: 1.2, fontWeight: 700 }}
                >
                  Book Coaching Session
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default function CoachesListPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading coaches..." />}>
      <CoachesListContent />
    </Suspense>
  );
}
