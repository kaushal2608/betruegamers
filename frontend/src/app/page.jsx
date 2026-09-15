'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Gamepad2,
  Users,
  Tv,
  Trophy,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Sun,
  Moon
} from 'lucide-react';
import { toggleThemeMode } from '@/store/slices/uiSlice';

const FEATURED_GAMES = [
  { name: 'Valorant', genre: 'Tactical Shooter', players: '2.4M Active', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80' },
  { name: 'Counter-Strike 2', genre: 'Competitive FPS', players: '1.8M Active', image: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=600&q=80' },
  { name: 'Fortnite', genre: 'Battle Royale', players: '3.1M Active', image: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=600&q=80' },
  { name: 'Apex Legends', genre: 'Hero Shooter', players: '1.2M Active', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80' }
];

const TESTIMONIALS = [
  {
    name: 'GhostRider99',
    role: 'Immortal 3 Player',
    text: 'The 1-on-1 screen share coaching session transformed my crosshair placement and decision making in just two hours!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Valkyrie_Pro',
    role: 'Apex Predator Coach',
    text: 'BeTrueGamers gives me the exact tooling I need: low-latency screen streaming, student scheduling, and verified reviews.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
  }
];

export default function LandingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      router.replace('/home');
    }
  }, [isAuthenticated, token, router]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', overflowX: 'hidden' }}>
      {/* Navigation Bar */}
      <Box
        component="header"
        sx={{
          py: 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: isDark ? 'rgba(8, 10, 15, 0.85)' : 'rgba(255, 255, 255, 0.85)'
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5} component={Link} href="/" sx={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '8px',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDark ? '0 0 15px rgba(0, 240, 255, 0.5)' : '0 2px 10px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Gamepad2 size={24} color={theme.palette.primary.contrastText} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.05em' }}>
                BE<Box component="span" sx={{ color: 'primary.main' }}>TRUE</Box>GAMERS
              </Typography>
            </Stack>

            <Stack direction="row" spacing={3} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
              <Typography component={Link} href="/login?redirect=/discover" sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}>
                Discover
              </Typography>
              <Typography component={Link} href="/login?redirect=/games" sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}>
                Games
              </Typography>
              <Typography component={Link} href="/login?redirect=/coaches" sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 600, '&:hover': { color: 'primary.main' } }}>
                Coaches
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton
                  onClick={() => dispatch(toggleThemeMode())}
                  sx={{
                    color: isDark ? '#eab308' : '#0284c7',
                    bgcolor: isDark ? 'rgba(234, 179, 8, 0.08)' : 'rgba(2, 132, 199, 0.08)',
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 0.8,
                    borderRadius: '8px'
                  }}
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </IconButton>
              </Tooltip>
              <Button component={Link} href="/login" variant="text" sx={{ color: 'text.primary', fontWeight: 600 }}>
                Sign In
              </Button>
              <Button component={Link} href="/signup" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
                Join Now
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 14 },
          pb: { xs: 10, md: 16 },
          background: isDark
            ? 'radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.12) 0%, rgba(139, 92, 246, 0.08) 35%, rgba(8, 10, 15, 0) 70%)'
            : 'radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.1) 0%, rgba(124, 58, 237, 0.06) 35%, rgba(248, 250, 252, 0) 70%)'
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Chip
            icon={<Sparkles size={16} color={theme.palette.primary.main} />}
            label="NEXT-GEN GAMING SOCIAL & COACHING"
            sx={{
              mb: 3,
              bgcolor: isDark ? 'rgba(0, 240, 255, 0.1)' : 'rgba(2, 132, 199, 0.08)',
              borderColor: isDark ? 'rgba(0, 240, 255, 0.3)' : 'rgba(2, 132, 199, 0.3)',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.1em'
            }}
            variant="outlined"
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
              fontWeight: 900,
              lineHeight: 1.1,
              mb: 3,
              background: isDark
                ? 'linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)'
                : 'linear-gradient(180deg, #0f172a 30%, #475569 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            LEVEL UP YOUR <Box component="span" sx={{ color: 'primary.main', WebkitTextFillColor: theme.palette.primary.main }}>GAME.</Box>
          </Typography>

          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 5, maxWidth: 650, mx: 'auto', lineHeight: 1.6 }}>
            Connect with passionate gamers, team up for ranked matches, and book live 1-on-1 coaching sessions powered by ultra-low-latency live screen sharing.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center">
            <Button
              component={Link}
              href="/login?redirect=/coaches"
              variant="contained"
              size="large"
              color="primary"
              endIcon={<ArrowRight size={20} />}
              sx={{ py: 1.8, px: 4, fontSize: '1.05rem', fontWeight: 800 }}
            >
              Explore Coaches
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="outlined"
              size="large"
              color="primary"
              sx={{ py: 1.8, px: 4, fontSize: '1.05rem', fontWeight: 700 }}
            >
              Get Started Free
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Featured Games Section */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 5 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.15em' }}>
                ACTIVE COMMUNITIES
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
                POPULAR GAMES
              </Typography>
            </Box>
            <Button component={Link} href="/login?redirect=/games" endIcon={<ArrowRight size={18} />} sx={{ color: 'primary.main', fontWeight: 700 }}>
              View All Games
            </Button>
          </Stack>

          <Grid container spacing={3}>
            {FEATURED_GAMES.map((game) => (
              <Grid item xs={12} sm={6} md={3} key={game.name}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover img': { transform: 'scale(1.08)' }
                  }}
                >
                  <Box sx={{ height: 180, overflow: 'hidden', position: 'relative' }}>
                    <Box
                      component="img"
                      src={game.image}
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
                        background: isDark
                          ? 'linear-gradient(180deg, transparent 40%, rgba(16, 20, 30, 0.95) 100%)'
                          : 'linear-gradient(180deg, transparent 40%, rgba(255, 255, 255, 0.95) 100%)'
                      }}
                    />
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {game.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                      {game.genre}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'accent.emerald' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {game.players}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How BeTrueGamers Works */}
      <Box sx={{ py: 12 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.15em' }}>
              HOW IT WORKS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
              ELEVATE YOUR GAMEPLAY IN 3 STEPS
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: <Users size={32} color={theme.palette.primary.main} />,
                title: '1. Create & Match',
                desc: 'Build your gamer identity, show off ranks, games, and match with peers or verified pro coaches.'
              },
              {
                icon: <Tv size={32} color={theme.palette.secondary.main} />,
                title: '2. Live Screen Share',
                desc: 'Hop into ultra-fast 1-on-1 live coaching rooms. Share your gameplay live with instant zero-delay coach feedback.'
              },
              {
                icon: <Trophy size={32} color="#ec4899" />,
                title: '3. Climb the Ladder',
                desc: 'Review sessions, track tactical breakthroughs, add coaches to your friends list, and conquer ranks.'
              }
            ].map((step, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card sx={{ p: 4, height: '100%', bgcolor: 'background.card', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ mb: 2.5 }}>{step.icon}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {step.desc}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ py: 10, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 7 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.15em' }}>
              REVIEWS & SUCCESS
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>
              PROVEN BY REAL GAMERS
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {TESTIMONIALS.map((t, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Card sx={{ p: 4, height: '100%' }}>
                  <Rating value={t.rating} readOnly sx={{ mb: 2, color: 'primary.main' }} />
                  <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 3, color: 'text.primary', lineHeight: 1.7 }}>
                    &ldquo;{t.text}&rdquo;
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={t.avatar} alt={t.name} sx={{ width: 48, height: 48, border: '2px solid', borderColor: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {t.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          textAlign: 'center',
          background: isDark
            ? 'linear-gradient(180deg, rgba(8, 10, 15, 0.8) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(8, 10, 15, 1) 100%)'
            : 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(124, 58, 237, 0.08) 50%, rgba(248, 250, 252, 1) 100%)'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: 900, mb: 2 }}>
            READY TO DOMINATE?
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4, maxWidth: 600, mx: 'auto' }}>
            Join thousands of gamers discovering teammates, learning from radiant coaches, and sharpening their game.
          </Typography>
          <Button
            component={Link}
            href="/signup"
            variant="contained"
            size="large"
            color="primary"
            sx={{ py: 2, px: 5, fontSize: '1.1rem' }}
          >
            Create Your Gamer Profile
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ py: 6, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Gamepad2 size={22} color={theme.palette.primary.main} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                BE<Box component="span" sx={{ color: 'primary.main' }}>TRUE</Box>GAMERS
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              &copy; {new Date().getFullYear()} BeTrueGamers. Built for competitive players and coaches.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
