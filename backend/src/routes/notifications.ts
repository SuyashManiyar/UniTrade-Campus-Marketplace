import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user's notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { unreadOnly } = req.query;

        const where: any = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;

        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await prisma.notification.delete({
            where: { id }
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

export default router;
