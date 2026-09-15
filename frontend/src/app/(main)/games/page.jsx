'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import { Search, Gamepad2, Users } from 'lucide-react';
import { useGetGamesQuery } from '@/store/api/gameApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const GENRES = ['All', 'Tactical Shooter', 'Competitive FPS', 'Battle Royale', 'Hero Shooter / BR', 'Action-Adventure / Roleplay', 'Sandbox / Survival'];

export default function GamesCatalogPage() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gamesData, isLoading } = useGetGamesQuery({
    genre: selectedGenre === 'All' ? undefined : selectedGenre,
    search: searchQuery.trim() || undefined
  });

  const games = gamesData?.data || [];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
          OFFICIAL TITLES
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, mt: 0.5, mb: 1 }}>
          GAMES CATALOG
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Explore verified esports titles, find teammates, and book top-tier coaches
        </Typography>
      </Box>

      {/* Search & Filters */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center">
        <TextField
          placeholder="Search games by name or genre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#94a3b8" />
              </InputAdornment>
            )
          }}
        />

        <Tabs
          value={selectedGenre}
          onChange={(e, val) => setSelectedGenre(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            flex: 1,
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 700,
              minHeight: 44,
              '&.Mui-selected': { color: 'primary.main' }
            }
          }}
        >
          {GENRES.map((g) => (
            <Tab key={g} label={g} value={g} />
          ))}
        </Tabs>
      </Stack>

      {/* Catalog Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading games catalog..." />
      ) : games.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No games found matching your search.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <Card
                component={Link}
                href={`/games/${game.slug}`}
                sx={{
                  display: 'block',
                  textDecoration: 'none',
                  height: '100%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover img': { transform: 'scale(1.08)' }
                }}
              >
                <Box sx={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                  <Box
                    component="img"
                    src={game.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'}
                    alt={game.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: (t) => t.palette.mode === 'dark' 
                        ? 'linear-gradient(180deg, transparent 30%, rgba(16, 20, 30, 0.95) 100%)'
                        : 'linear-gradient(180deg, transparent 30%, rgba(255, 255, 255, 0.9) 100%)'
                    }}
                  />
                  <Chip
                    label={game.genre}
                    size="small"
                    color="primary"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontWeight: 700,
                      backdropFilter: 'blur(6px)'
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.8 }}>
                    {game.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {game.description}
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Users size={16} color="#10b981" />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {game.active_players_count ? `${(game.active_players_count / 1000000).toFixed(1)}M Active` : 'Active community'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      {game.platforms?.map((p) => (
                        <Chip key={p} label={p} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'background.subtle' }} />
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
