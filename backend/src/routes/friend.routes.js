import { Router } from 'express';
import { friendController } from '../controllers/friend.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', friendController.getFriends);
router.get('/search', friendController.searchFriends);
router.get('/requests', friendController.getPendingRequests);
router.post('/request', friendController.sendRequest);
router.post('/requests/:id/accept', friendController.acceptRequest);
router.post('/requests/:id/reject', friendController.rejectRequest);
router.delete('/requests/:id/cancel', friendController.cancelRequest);
router.delete('/:friendId', friendController.removeFriend);

export default router;
