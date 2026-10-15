import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getConversations,
  getThreadMessages,
  sendMessage,
  getUnreadCount,
  markThreadRead,
} from '../controllers/messageController';

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

router.get('/conversations', getConversations);
router.get('/unread', getUnreadCount);
router.get('/thread/:thread_id', getThreadMessages);
router.post('/send', sendMessage);
router.patch('/thread/:thread_id/read', markThreadRead);

export default router;
