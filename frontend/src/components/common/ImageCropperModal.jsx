'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  Stack,
  IconButton,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Check,
  X,
  Crop as CropIcon
} from 'lucide-react';

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

/**
 * Crops and rotates the image on an HTML5 canvas and returns a File object ready for upload.
 */
async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const targetSize = Math.min(Math.max(pixelCrop.width, pixelCrop.height, 400), 800);

  if (rotation === 0) {
    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetSize,
      targetSize
    );
  } else {
    // Handling rotation
    const rad = getRadianAngle(rotation);
    const bBoxWidth = Math.abs(Math.cos(rad) * image.width) + Math.abs(Math.sin(rad) * image.height);
    const bBoxHeight = Math.abs(Math.sin(rad) * image.width) + Math.abs(Math.cos(rad) * image.height);

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = bBoxWidth;
    tempCanvas.height = bBoxHeight;

    tempCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    tempCtx.rotate(rad);
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2);

    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      tempCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetSize,
      targetSize
    );
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        resolve({ file, previewUrl: URL.createObjectURL(blob) });
      },
      'image/jpeg',
      0.92
    );
  });
}

export default function ImageCropperModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  isUploading = false,
  confirmText = 'Save & Upload Avatar',
  uploadingText = 'Uploading image...'
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (newCrop) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom) => {
    setZoom(newZoom);
  };

  const handleCropComplete = useCallback((croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (result?.file) {
        onCropComplete(result.file, result.previewUrl);
      }
    } catch (err) {
      console.error('Failed to crop image:', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isUploading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark
            ? '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)'
            : '0 20px 60px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.04em', color: 'text.primary' }}>
              ADJUST PROFILE PICTURE
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.3 }}>
              Drag to reposition, zoom, or rotate to frame your avatar perfectly.
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isUploading}
            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
            size="small"
          >
            <X size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Interactive Cropper Viewport */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 280, sm: 340 },
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: isDark ? '#05070c' : '#000',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={handleCropComplete}
            />
          )}
        </Box>

        {/* Adjustments: Zoom Slider & Rotation Buttons */}
        <Box sx={{ mt: 3, px: 1 }}>
          <Stack spacing={2}>
            {/* Zoom Slider */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Tooltip title="Zoom Out">
                <IconButton
                  size="small"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                  sx={{ color: 'text.secondary' }}
                >
                  <ZoomOut size={18} />
                </IconButton>
              </Tooltip>

              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(e, val) => setZoom(val)}
                sx={{
                  color: 'primary.main',
                  height: 6,
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    boxShadow: isDark
                      ? '0 0 10px rgba(0, 240, 255, 0.6)'
                      : '0 2px 8px rgba(2, 132, 199, 0.4)'
                  },
                  '& .MuiSlider-rail': {
                    bgcolor: 'divider'
                  }
                }}
              />

              <Tooltip title="Zoom In">
                <IconButton
                  size="small"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  sx={{ color: 'primary.main' }}
                >
                  <ZoomIn size={18} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Quick Actions (Rotate & Reset) */}
            <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center">
              <Button
                variant="outlined"
                size="small"
                startIcon={<RotateCcw size={15} />}
                onClick={handleRotateLeft}
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                }}
              >
                Rotate -90°
              </Button>

              <Button
                variant="outlined"
                size="small"
                startIcon={<RotateCw size={15} />}
                onClick={handleRotateRight}
                sx={{
                  borderColor: 'divider',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                }}
              >
                Rotate +90°
              </Button>

              <Button
                variant="text"
                size="small"
                startIcon={<RefreshCw size={14} />}
                onClick={handleReset}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  '&:hover': { color: 'text.primary' }
                }}
              >
                Reset
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isUploading}
          variant="outlined"
          sx={{
            borderColor: 'divider',
            color: 'text.secondary',
            px: 2.5,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': { color: 'text.primary', borderColor: 'divider' }
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleApply}
          disabled={isUploading}
          variant="contained"
          color="primary"
          startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <Check size={18} />}
          sx={{
            px: 3.5,
            py: 1,
            fontWeight: 800,
            textTransform: 'none'
          }}
        >
          {isUploading ? uploadingText : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
