import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { MessageService } from '../services/messageService';

export async function getConversations(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const conversations = await MessageService.getConversations(userId!);
    return res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving conversations.' });
  }
}

export async function getThreadMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { thread_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await MessageService.getThreadMessages(
      thread_id,
      userId!,
      Number(limit),
      Number(offset)
    );

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error('Get Thread Messages Error:', error);
    if (error instanceof Error && error.message === 'THREAD_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Thread not found.' });
    }
    return res.status(500).json({ success: false, message: 'Internal server error retrieving messages.' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const senderId = req.user?.userId;
    const { receiver_id, content, thread_id } = req.body;

    if (!receiver_id || !content) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required.' });
    }

    const message = await MessageService.sendMessage(senderId!, receiver_id, content, thread_id);

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: message,
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error sending message.' });
  }
}

export async function getUnreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const count = await MessageService.getUnreadCount(userId!);
    return res.status(200).json({ success: true, data: { unread_count: count } });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving unread count.' });
  }
}

export async function markThreadRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { thread_id } = req.params;

    await db('messages')
      .where('thread_id', thread_id)
      .where('receiver_id', userId)
      .where('is_read', false)
      .update({
        is_read: true,
        read_at: db.fn.now(),
      });

    return res.status(200).json({
      success: true,
      message: 'All messages in thread marked as read.',
    });
  } catch (error) {
    console.error('Mark Thread Read Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error marking messages as read.' });
  }
}
