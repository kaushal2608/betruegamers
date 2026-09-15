'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Grid,
  Divider
} from '@mui/material';
import { ArrowLeft, Users, Shield, Trophy, Tv } from 'lucide-react';
import { useGetGameBySlugQuery } from '@/store/api/gameApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const { data: gameData, isLoading } = useGetGameBySlugQuery(slug, { skip: !slug });

  if (isLoading) {
    return <LoadingSpinner message="Loading game community..." />;
  }

  const game = gameData?.data;

  if (!game) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ color: '#ef4444', mb: 2 }}>
          Game Not Found
        </Typography>
        <Button variant="outlined" onClick={() => router.push('/games')}>
          Back to Catalog
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Button
        startIcon={<ArrowLeft size={18} />}
        onClick={() => router.push('/games')}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        All Games
      </Button>

      {/* Hero Banner Card */}
      <Card sx={{ mb: 4, overflow: 'hidden' }}>
        <Box
          sx={{
            height: { xs: 220, sm: 320 },
            backgroundImage: `url(${game.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(8, 10, 15, 0.3) 0%, rgba(16, 20, 30, 0.95) 100%)'
            }
          }}
        />

        <CardContent sx={{ pt: 3, pb: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Chip label={game.genre} size="small" color="primary" sx={{ fontWeight: 800, mb: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 900 }}>
                {game.name}
              </Typography>
            </Box>

            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                href={`/coaches?game=${encodeURIComponent(game.name)}`}
                variant="contained"
                color="primary"
                startIcon={<Shield size={18} />}
              >
                Find Coaches
              </Button>
              <Button
                component={Link}
                href={`/discover?game=${encodeURIComponent(game.name)}`}
                variant="outlined"
                startIcon={<Users size={18} />}
              >
                Find Players
              </Button>
            </Stack>
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7, maxWidth: 850, mb: 3 }}>
            {game.description}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Platforms
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                {game.platforms?.map((p) => (
                  <Chip key={p} label={p} size="small" />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Active Players
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'accent.emerald', mt: 0.5 }}>
                {game.active_players_count ? `${(game.active_players_count / 1000000).toFixed(1)}M Active` : 'Online'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Live Coaching
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                Available (Live 1-on-1)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
