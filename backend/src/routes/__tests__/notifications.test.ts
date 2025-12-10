import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
    }
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
    authenticateToken: jest.fn((req: any, res: any, next: any) => {
        req.user = {
            id: 'user123',
            email: 'test@umass.edu',
            role: 'STUDENT'
        };
        next();
    })
}));

// Import router after mocks
import notificationsRouter from '../notifications';

const app = express();
app.use(express.json());
app.use('/api/notifications', notificationsRouter);

describe('Notifications Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/notifications', () => {
        it('should return user notifications', async () => {
            const mockNotifications = [
                {
                    id: 'notif1',
                    userId: 'user123',
                    type: 'BID',
                    message: 'New bid on your item',
                    isRead: false,
                    createdAt: new Date()
                }
            ];

            mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
            mockPrisma.notification.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/notifications');

            expect(response.status).toBe(200);
            expect(response.body.notifications).toBeDefined();
            expect(response.body.unreadCount).toBe(1);
        });

        it('should filter unread notifications', async () => {
            mockPrisma.notification.findMany.mockResolvedValue([]);
            mockPrisma.notification.count.mockResolvedValue(0);

            const response = await request(app)
                .get('/api/notifications')
                .query({ unreadOnly: 'true' });

            expect(response.status).toBe(200);
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isRead: false })
                })
            );
        });
    });

    describe('PUT /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                type: 'BID',
                message: 'Test',
                isRead: false
            };

            mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrisma.notification.update.mockResolvedValue({
                ...mockNotification,
                isRead: true
            });

            const response = await request(app)
                .put('/api/notifications/notif1/read');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification marked as read');
        });

        it('should return 404 if notification not found', async () => {
            mockPrisma.notification.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/notifications/nonexistent/read');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Notification not found');
        });

        it('should return 403 if not authorized', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'otheruser',
                type: 'BID',
                message: 'Test',
                isRead: false
            };

            mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

            const response = await request(app)
                .put('/api/notifications/notif1/read');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Not authorized');
        });
    });

    describe('PUT /api/notifications/mark-all-read', () => {
        it('should mark all notifications as read', async () => {
            mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

            const response = await request(app)
                .put('/api/notifications/mark-all-read');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All notifications marked as read');
        });
    });

    describe('DELETE /api/notifications/:id', () => {
        it('should delete notification', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'user123',
                type: 'BID',
                message: 'Test'
            };

            mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
            mockPrisma.notification.delete.mockResolvedValue(mockNotification);

            const response = await request(app)
                .delete('/api/notifications/notif1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification deleted');
        });

        it('should return 404 if notification not found', async () => {
            mockPrisma.notification.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/notifications/nonexistent');

            expect(response.status).toBe(404);
        });

        it('should return 403 if not authorized', async () => {
            const mockNotification = {
                id: 'notif1',
                userId: 'otheruser',
                type: 'BID',
                message: 'Test'
            };

            mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);

            const response = await request(app)
                .delete('/api/notifications/notif1');

            expect(response.status).toBe(403);
        });
    });
});
