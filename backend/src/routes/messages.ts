import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { messageSchema } from '../utils/validation';

const router = Router();
const prisma = new PrismaClient();

// Get conversations for a user
router.get('/conversations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get unique conversations
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        },
        listing: {
          select: { id: true, title: true, images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by listing and other user
    const conversationMap = new Map();
    
    conversations.forEach(message => {
      const otherUser = message.senderId === userId ? message.receiver : message.sender;
      const key = `${message.listingId}-${otherUser.id}`;
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          listingId: message.listingId,
          listing: message.listing,
          otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      // Count unread messages
      if (message.receiverId === userId && !message.isRead) {
        conversationMap.get(key).unreadCount++;
      }
    });

    const conversationList = Array.from(conversationMap.values());
    
    res.json(conversationList);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:listingId/:otherUserId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { listingId, otherUserId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { content, receiverId, listingId } = messageSchema.parse(req.body);

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        receiverId,
        listingId
      },
      include: {
        sender: {
          select: { id: true, name: true }
        },
        receiver: {
          select: { id: true, name: true }
        },
        listing: {
          select: { id: true, title: true }
        }
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// Mark messages as read
router.put('/mark-read/:conversationId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { listingId, otherUserId } = req.body;

    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;