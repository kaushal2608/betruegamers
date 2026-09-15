import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Protect all user endpoints with authentication
router.use(authenticate);

router.post('/avatar', upload.single('image'), userController.uploadAvatar);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getById);
router.patch('/profile', userController.updateProfile);
router.patch('/theme', userController.updateTheme);

router.get('/:id/games', userController.getUserGames);
router.post('/games', userController.addUserGame);
router.delete('/games/:gameId', userController.removeUserGame);

export default router;

