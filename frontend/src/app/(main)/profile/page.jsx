'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
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
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import {
  Edit3,
  Trophy,
  Gamepad2,
  Calendar,
  Globe,
  Shield,
  Clock,
  Sparkles,
  Camera
} from 'lucide-react';
import {
  useGetUserByIdQuery,
  useGetUserGamesQuery,
  useUploadAvatarMutation
} from '@/store/api/userApi';
import { setCredentials } from '@/store/slices/authSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ImageCropperModal from '@/components/common/ImageCropperModal';

export default function ProfilePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const { user: authUser, token } = useSelector((state) => state.auth);
  const userId = authUser?.id;
  const fileInputRef = useRef(null);

  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);

  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const { data: userGames, isLoading: isGamesLoading } = useGetUserGamesQuery(userId, { skip: !userId });
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();

  const [toast, setToast] = useState({ open: false, severity: 'success', message: '' });

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ open: true, severity: 'error', message: 'Please select a valid image file (JPEG, PNG, WEBP)' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setToast({ open: true, severity: 'error', message: 'Image must be under 8MB' });
      return;
    }

    e.target.value = '';

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageForCrop(reader.result);
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedAvatarSave = async (croppedFile) => {
    try {
      const formData = new FormData();
      formData.append('image', croppedFile);
      const res = await uploadAvatar(formData).unwrap();
      if (res.success) {
        setToast({ open: true, severity: 'success', message: 'Profile picture cropped & uploaded successfully!' });
        if (res.data?.user) {
          dispatch(setCredentials({ user: res.data.user, token }));
        }
        setCropperModalOpen(false);
        setRawImageForCrop(null);
      }
    } catch (err) {
      setToast({ open: true, severity: 'error', message: err?.data?.message || 'Failed to upload cropped image' });
    }
  };

  if (isUserLoading || isGamesLoading) {
    return <LoadingSpinner message="Loading your gamer profile..." />;
  }

  const user = userData?.data || authUser;
  const games = userGames?.data || [];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {/* Banner & Avatar Header */}
      <Card sx={{ mb: 4, overflow: 'hidden', position: 'relative' }}>
        <Box
          sx={{
            height: { xs: 160, sm: 220 },
            backgroundImage: `url(${user?.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80'})`,
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

        <CardContent sx={{ pt: 0, pb: 3, position: 'relative' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'center', sm: 'flex-end' }}
            sx={{ mt: { xs: -7, sm: -9 }, mb: 2 }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-end' }} spacing={2.5}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={user?.avatar_url}
                  alt={user?.username}
                  sx={{
                    width: { xs: 100, sm: 130 },
                    height: { xs: 100, sm: 130 },
                    border: '4px solid',
                    borderColor: 'background.paper',
                    boxShadow: isDark ? '0 0 25px rgba(0, 240, 255, 0.4)' : '0 4px 20px rgba(2, 132, 199, 0.25)',
                    filter: isUploadingAvatar ? 'brightness(0.5)' : 'none',
                    transition: 'filter 0.2s ease'
                  }}
                />
                {isUploadingAvatar ? (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <CircularProgress size={32} sx={{ color: 'primary.main' }} />
                  </Box>
                ) : (
                  <Tooltip title="Upload profile picture">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        boxShadow: isDark ? '0 0 12px rgba(0, 240, 255, 0.7)' : '0 2px 8px rgba(2, 132, 199, 0.5)',
                        p: 0.8,
                        '&:hover': { bgcolor: 'primary.light' }
                      }}
                    >
                      <Camera size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  style={{ display: 'none' }}
                />
              </Box>
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
                    {user?.username || 'Gamer'}
                  </Typography>
                  <Chip
                    label={user?.role || 'GAMER'}
                    size="small"
                    color={user?.role === 'COACH' ? 'secondary' : 'primary'}
                    sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                  />
                </Stack>
                <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {user?.full_name || 'BeTrueGamers Player'}
                </Typography>
              </Box>
            </Stack>

            <Button
              component={Link}
              href="/profile/edit"
              variant="outlined"
              color="primary"
              startIcon={<Edit3 size={16} />}
              sx={{ mt: { xs: 2, sm: 0 }, borderRadius: '8px' }}
            >
              Edit Profile
            </Button>
          </Stack>

          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 2, mb: 3, maxWidth: 800, lineHeight: 1.6 }}>
            {user?.bio || 'No bio provided yet. Click Edit Profile to showcase your gaming goals!'}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Metadata Badges */}
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Trophy size={16} color={theme.palette.primary.main} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Tier: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{user?.experience_level || 'Intermediate'}</Box>
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Globe size={16} color={theme.palette.secondary.main} />
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Region: <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>{user?.country || 'Global'}</Box>
              </Typography>
            </Stack>
            {user?.discord_tag && (
              <Chip label={`Discord: ${user.discord_tag}`} size="small" sx={{ bgcolor: 'rgba(114, 137, 218, 0.15)', color: '#7289da' }} />
            )}
            {user?.riot_id && (
              <Chip label={`Riot: ${user.riot_id}`} size="small" sx={{ bgcolor: 'rgba(235, 0, 41, 0.15)', color: '#eb0029' }} />
            )}
            {user?.steam_id && (
              <Chip label={`Steam: ${user.steam_id}`} size="small" sx={{ bgcolor: 'action.selected', color: 'text.primary' }} />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Linked Games Showcase */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Gamepad2 size={24} color={theme.palette.primary.main} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              GAMES PLAYED ({games.length})
            </Typography>
          </Stack>
          <Button component={Link} href="/profile/edit" size="small" color="primary">
            + Add Games
          </Button>
        </Stack>

        {games.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.card', border: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              You haven&apos;t linked any competitive games to your profile yet.
            </Typography>
            <Button component={Link} href="/profile/edit" variant="contained" color="primary">
              Link Your Favorite Games
            </Button>
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
                      <Chip label={g.in_game_rank} size="small" sx={{ bgcolor: isDark ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)', color: 'primary.main', fontWeight: 700 }} />
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

      {/* Upload Notification Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      <ImageCropperModal
        open={cropperModalOpen}
        imageSrc={rawImageForCrop}
        onClose={() => {
          setCropperModalOpen(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCroppedAvatarSave}
        isUploading={isUploadingAvatar}
      />
    </Box>
  );
}
