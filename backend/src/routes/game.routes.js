import { Router } from 'express';
import { gameController } from '../controllers/game.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Protect all game endpoints with authentication
router.use(authenticate);

router.get('/', gameController.getAll);
router.get('/:slug', gameController.getBySlug);
router.post('/', authorize('ADMIN'), gameController.create);

export default router;

