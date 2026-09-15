'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  Alert,
  Divider,
  Paper,
  IconButton,
  Avatar,
  CircularProgress
} from '@mui/material';
import { Save, Trash2, ArrowLeft, Gamepad2, Camera, Upload } from 'lucide-react';
import {
  useGetUserByIdQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useGetUserGamesQuery,
  useAddUserGameMutation,
  useRemoveUserGameMutation
} from '@/store/api/userApi';
import { useGetGamesQuery } from '@/store/api/gameApi';
import { setCredentials } from '@/store/slices/authSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ImageCropperModal from '@/components/common/ImageCropperModal';

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Semi-Pro', 'Pro'];

export default function EditProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user: authUser, token } = useSelector((state) => state.auth);
  const userId = authUser?.id;
  const avatarInputRef = useRef(null);

  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);

  const { data: userData, isLoading: isUserLoading } = useGetUserByIdQuery(userId, { skip: !userId });
  const { data: userGames, isLoading: isUserGamesLoading } = useGetUserGamesQuery(userId, { skip: !userId });
  const { data: catalogGames } = useGetGamesQuery();

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  const [addUserGame, { isLoading: isAddingGame }] = useAddUserGameMutation();
  const [removeUserGame] = useRemoveUserGameMutation();

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    country: 'Global',
    experience_level: 'Intermediate',
    discord_tag: '',
    steam_id: '',
    riot_id: ''
  });

  const [newGameData, setNewGameData] = useState({
    gameId: '',
    inGameRank: '',
    mainRole: '',
    hoursPlayed: 0
  });

  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (userData?.data) {
      const u = userData.data;
      setFormData({
        full_name: u.full_name || '',
        bio: u.bio || '',
        country: u.country || 'Global',
        experience_level: u.experience_level || 'Intermediate',
        discord_tag: u.discord_tag || '',
        steam_id: u.steam_id || '',
        riot_id: u.riot_id || ''
      });
    }
  }, [userData]);

  if (isUserLoading || isUserGamesLoading) {
    return <LoadingSpinner message="Loading profile settings..." />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setFeedbackMsg({ type: '', text: '' });
    try {
      await updateProfile(formData).unwrap();
      setFeedbackMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.data?.message || 'Failed to update profile.' });
    }
  };

  const handleAddGame = async (e) => {
    e.preventDefault();
    if (!newGameData.gameId) return;

    try {
      await addUserGame({
        gameId: newGameData.gameId,
        inGameRank: newGameData.inGameRank || 'Unranked',
        mainRole: newGameData.mainRole || 'All-Rounder',
        hoursPlayed: parseInt(newGameData.hoursPlayed || '0', 10),
        isFavorite: true
      }).unwrap();

      setNewGameData({ gameId: '', inGameRank: '', mainRole: '', hoursPlayed: 0 });
      setFeedbackMsg({ type: 'success', text: 'Game added to your profile!' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.data?.message || 'Failed to add game.' });
    }
  };

  const handleRemoveGame = async (gameId) => {
    try {
      await removeUserGame(gameId).unwrap();
      setFeedbackMsg({ type: 'success', text: 'Game removed from profile.' });
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: 'Failed to remove game.' });
    }
  };

  const gamesList = userGames?.data || [];
  const catalog = catalogGames?.data || [];

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, WEBP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFeedbackMsg({ type: 'error', text: 'Image file size must be less than 8MB.' });
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
        setFeedbackMsg({ type: 'success', text: 'Profile picture updated successfully!' });
        if (res.data?.user) {
          dispatch(setCredentials({ user: res.data.user, token }));
        }
        setCropperModalOpen(false);
        setRawImageForCrop(null);
      }
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.data?.message || 'Failed to upload profile picture. Please try again.' });
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => router.push('/profile')} sx={{ color: 'text.primary' }}>
          <ArrowLeft size={22} />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          EDIT GAMER PROFILE
        </Typography>
      </Stack>

      {feedbackMsg.text && (
        <Alert
          severity={feedbackMsg.type}
          sx={{
            mb: 3,
            bgcolor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'
          }}
        >
          {feedbackMsg.text}
        </Alert>
      )}

      {/* Avatar Upload Card */}
      <Card sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Profile Picture
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={3}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={userData?.data?.avatar_url || authUser?.avatar_url}
              alt="Avatar"
              sx={{
                width: 96,
                height: 96,
                border: '3px solid',
                borderColor: 'primary.main',
                boxShadow: (t) => t.palette.mode === 'dark' ? '0 0 20px rgba(0, 240, 255, 0.35)' : '0 0 20px rgba(2, 132, 199, 0.2)',
                filter: isUploadingAvatar ? 'brightness(0.4)' : 'none'
              }}
            />
            {isUploadingAvatar && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={28} color="primary" />
              </Box>
            )}
          </Box>
          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Upload New Avatar
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              JPG, PNG or WEBP up to 5MB.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              disabled={isUploadingAvatar}
              startIcon={isUploadingAvatar ? <CircularProgress size={16} color="inherit" /> : <Upload size={16} />}
              onClick={() => avatarInputRef.current?.click()}
              sx={{ borderRadius: '8px' }}
            >
              {isUploadingAvatar ? 'Uploading...' : 'Choose Image'}
            </Button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleAvatarFileChange}
              style={{ display: 'none' }}
            />
          </Box>
        </Stack>
      </Card>

      {/* Main Profile Info Form */}
      <Card sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          General Identity
        </Typography>
        <Box component="form" onSubmit={handleSubmitProfile}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name / Display Name"
                name="full_name"
                fullWidth
                value={formData.full_name}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Experience Tier"
                name="experience_level"
                fullWidth
                value={formData.experience_level}
                onChange={handleChange}
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <MenuItem key={lvl} value={lvl}>
                    {lvl}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Gamer Bio"
                name="bio"
                multiline
                rows={3}
                fullWidth
                value={formData.bio}
                onChange={handleChange}
                placeholder="Share your favorite agents, playstyle, tournament experience, or goals..."
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Country / Region"
                name="country"
                fullWidth
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Discord Tag"
                name="discord_tag"
                fullWidth
                value={formData.discord_tag}
                onChange={handleChange}
                placeholder="User#1234"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Riot ID"
                name="riot_id"
                fullWidth
                value={formData.riot_id}
                onChange={handleChange}
                placeholder="Gamer#EUW"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                disabled={isUpdating}
                sx={{ py: 1.2, px: 3 }}
              >
                {isUpdating ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Linked Games Management */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Gamepad2 size={22} color="var(--mui-palette-primary-main, currentColor)" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Manage Your Games
          </Typography>
        </Stack>

        {/* Existing Games List */}
        {gamesList.map((g) => (
          <Paper
            key={g.id}
            sx={{
              p: 2,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'background.card'
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {g.game_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Rank: <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>{g.in_game_rank}</Typography> | Role: {g.main_role} | {g.hours_played} hrs
              </Typography>
            </Box>
            <IconButton onClick={() => handleRemoveGame(g.game_id)} sx={{ color: 'error.main' }}>
              <Trash2 size={18} />
            </IconButton>
          </Paper>
        ))}

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
          + Link Another Game
        </Typography>

        <Box component="form" onSubmit={handleAddGame}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Select Game"
                fullWidth
                value={newGameData.gameId}
                onChange={(e) => setNewGameData({ ...newGameData, gameId: e.target.value })}
                required
              >
                {catalog.map((game) => (
                  <MenuItem key={game.id} value={game.id}>
                    {game.name} ({game.genre})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="In-Game Rank"
                fullWidth
                placeholder="e.g. Diamond 2, Faceit Lvl 8"
                value={newGameData.inGameRank}
                onChange={(e) => setNewGameData({ ...newGameData, inGameRank: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Main Role / Agent"
                fullWidth
                placeholder="e.g. Duelist, AWPer, Tank"
                value={newGameData.mainRole}
                onChange={(e) => setNewGameData({ ...newGameData, mainRole: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Hours Played"
                type="number"
                fullWidth
                value={newGameData.hoursPlayed}
                onChange={(e) => setNewGameData({ ...newGameData, hoursPlayed: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="outlined"
                color="primary"
                disabled={isAddingGame || !newGameData.gameId}
              >
                Link Game to Profile
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Card>

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
