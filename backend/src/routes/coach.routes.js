import { Router } from 'express';
import { coachController } from '../controllers/coach.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all coach endpoints with authentication
router.use(authenticate);

router.get('/', coachController.getAll);
router.get('/:id', coachController.getById);

export default router;

