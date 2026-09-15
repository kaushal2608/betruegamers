import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', chatController.getConversations);
router.post('/', chatController.startConversation);
router.get('/:id/messages', chatController.getMessages);
router.post('/:id/messages', chatController.sendMessage);
router.patch('/:id/read', chatController.markAsRead);

export default router;
