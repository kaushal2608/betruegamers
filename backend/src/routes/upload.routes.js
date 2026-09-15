import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Protect upload endpoint with auth
router.use(authenticate);

// Upload image (accepts multipart file named 'image' or 'file', or JSON body with { image: 'data:image/...' })
router.post('/image', upload.single('image'), uploadController.uploadImage);

export default router;
