import { Router } from 'express';
import { coachingController } from '../controllers/coaching.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/sessions', coachingController.requestSession);
router.get('/sessions', coachingController.getUserSessions);
router.get('/sessions/:id', coachingController.getSession);
router.patch('/sessions/:id/status', coachingController.updateStatus);
router.post('/reviews', coachingController.submitReview);

export default router;
