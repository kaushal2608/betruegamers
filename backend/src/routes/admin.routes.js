import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorize('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/block', adminController.toggleBlockUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/coaches/:id/verify', adminController.verifyCoach);

export default router;
