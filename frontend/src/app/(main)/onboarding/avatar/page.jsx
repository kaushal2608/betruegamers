'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Upload,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { useUploadAvatarMutation } from '@/store/api/userApi';
import { setCredentials } from '@/store/slices/authSlice';
import ImageCropperModal from '@/components/common/ImageCropperModal';

const GAMER_PRESETS = [
  { id: 'p1', name: 'Cyber Mech', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberMech' },
  { id: 'p2', name: 'Neon Valkyrie', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonValkyrie' },
  { id: 'p3', name: 'Shadow Shinobi', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowShinobi' },
  { id: 'p4', name: 'Pixel Knight', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PixelKnight' },
  { id: 'p5', name: 'Void Phantom', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=VoidPhantom' }
];

export default function OnboardingAvatarPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState(null);

  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();

  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 8MB.');
      return;
    }

    e.target.value = '';
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageForCrop(reader.result);
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile, localPreviewUrl) => {
    setSelectedFile(croppedFile);
    setPreviewUrl(localPreviewUrl);
    setCropperModalOpen(false);
    setRawImageForCrop(null);
  };

  const handlePresetSelect = (presetUrl) => {
    setSelectedFile(null);
    setPreviewUrl(presetUrl);
    setErrorMsg('');
  };

  const handleSaveAvatar = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!previewUrl) {
      setErrorMsg('Please select or upload a profile picture.');
      return;
    }

    try {
      let res;
      if (selectedFile) {
        // Upload file directly through backend
        const formData = new FormData();
        formData.append('image', selectedFile);
        res = await uploadAvatar(formData).unwrap();
      } else {
        // Selected preset or external URL
        res = await uploadAvatar({ avatarUrl: previewUrl }).unwrap();
      }

      if (res.success) {
        setSuccessMsg('Profile picture uploaded successfully!');
        if (res.data?.user) {
          dispatch(setCredentials({ user: res.data.user, token }));
        }
        setTimeout(() => {
          router.push('/home');
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to upload profile picture. Please try again.');
    }
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      <Card
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          boxShadow: '0 0 35px rgba(0, 240, 255, 0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Glow accent top bar */}
        <Box
          sx={{
            height: 4,
            background: (t) => `linear-gradient(90deg, ${t.palette.primary.main} 0%, ${t.palette.secondary.main} 50%, ${t.palette.primary.main} 100%)`
          }}
        />

        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
            <Box>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
                <Sparkles size={20} color="var(--mui-palette-primary-main, currentColor)" />
                <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.15em' }}>
                  STEP 2 OF 2: SETUP YOUR IDENTITY
                </Typography>
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Upload Your <Typography component="span" variant="h4" sx={{ color: 'primary.main', fontWeight: 800 }}>Profile Picture</Typography>
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450 }}>
                Welcome, <strong>{user?.username || 'Gamer'}</strong>! Show opponents and teammates who you are in BeTrueGamers.
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ width: '100%', bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" sx={{ width: '100%', bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                {successMsg}
              </Alert>
            )}

            {/* Avatar Preview */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={previewUrl}
                alt="Avatar Preview"
                sx={{
                  width: 140,
                  height: 140,
                  border: '4px solid',
                  borderColor: 'primary.main',
                  boxShadow: isDark ? '0 0 30px rgba(0, 240, 255, 0.4)' : '0 4px 20px rgba(2, 132, 199, 0.3)',
                  bgcolor: 'background.paper'
                }}
              />
              <Tooltip title="Choose file to upload">
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: isDark ? '0 0 15px rgba(0, 240, 255, 0.6)' : '0 2px 8px rgba(2, 132, 199, 0.4)',
                    '&:hover': { bgcolor: 'primary.light' }
                  }}
                >
                  <Camera size={20} />
                </IconButton>
              </Tooltip>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </Box>

            {/* Upload Box */}
            <Paper
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: '100%',
                p: 3,
                cursor: 'pointer',
                border: '2px dashed',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 132, 199, 0.08)'
                }
              }}
            >
              <Stack spacing={1} alignItems="center">
                <Upload size={32} color={theme.palette.primary.main} />
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {selectedFile ? selectedFile.name : 'Click or Drag image here to upload'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Supports PNG, JPG, WEBP (Max 5MB)
                </Typography>
              </Stack>
            </Paper>

            <Divider sx={{ width: '100%', my: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                OR CHOOSE A GAMING AVATAR
              </Typography>
            </Divider>

            {/* Gamer Presets */}
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              {GAMER_PRESETS.map((preset) => {
                const isSelected = previewUrl === preset.url && !selectedFile;
                return (
                  <Tooltip key={preset.id} title={preset.name}>
                    <Box
                      onClick={() => handlePresetSelect(preset.url)}
                      sx={{
                        p: 0.5,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? 'primary.main' : 'transparent',
                        boxShadow: isSelected ? (isDark ? '0 0 15px rgba(0, 240, 255, 0.6)' : '0 2px 10px rgba(2, 132, 199, 0.4)') : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'scale(1.1)' }
                      }}
                    >
                      <Avatar
                        src={preset.url}
                        alt={preset.name}
                        sx={{ width: 52, height: 52, bgcolor: 'background.paper' }}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </Stack>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleSkip}
                disabled={isUploading}
                sx={{
                  flex: 1,
                  py: 1.4,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontWeight: 700,
                  '&:hover': { borderColor: 'text.primary', color: 'text.primary' }
                }}
              >
                Skip For Now
              </Button>

              <Button
                variant="contained"
                onClick={handleSaveAvatar}
                disabled={isUploading}
                startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle2 size={18} />}
                sx={{
                  flex: 2,
                  py: 1.4,
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: isDark ? '0 0 20px rgba(0, 240, 255, 0.4)' : '0 2px 10px rgba(2, 132, 199, 0.3)',
                  '&:hover': { bgcolor: 'primary.light' }
                }}
              >
                {isUploading ? 'Uploading...' : 'Save & Continue'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <ImageCropperModal
        open={cropperModalOpen}
        imageSrc={rawImageForCrop}
        confirmText="Apply Cropped Avatar"
        onClose={() => {
          setCropperModalOpen(false);
          setRawImageForCrop(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </Box>
  );
}
