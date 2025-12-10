import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    message: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
    },
    listing: {
        findUnique: jest.fn()
    },
    user: {
        findUnique: jest.fn()
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
import messagesRouter from '../messages';

const app = express();
app.use(express.json());
app.use('/api/messages', messagesRouter);

describe('Messages Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/messages/conversations', () => {
        it('should return user conversations', async () => {
            const mockMessages = [
                {
                    id: 'msg1',
                    content: 'Hello',
                    senderId: 'user123',
                    receiverId: 'user456',
                    listingId: 'listing1',
                    isRead: false,
                    createdAt: new Date(),
                    sender: { id: 'user123', name: 'User 1' },
                    receiver: { id: 'user456', name: 'User 2' },
                    listing: { id: 'listing1', title: 'Test Item', images: [] }
                }
            ];

            mockPrisma.message.findMany.mockResolvedValue(mockMessages);

            const response = await request(app)
                .get('/api/messages/conversations');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should group conversations by listing and other user', async () => {
            const mockMessages = [
                {
                    id: 'msg1',
                    content: 'Hello',
                    senderId: 'user456',
                    receiverId: 'user123',
                    listingId: 'listing1',
                    isRead: false,
                    createdAt: new Date(),
                    sender: { id: 'user456', name: 'User 2' },
                    receiver: { id: 'user123', name: 'User 1' },
                    listing: { id: 'listing1', title: 'Test Item', images: [] }
                },
                {
                    id: 'msg2',
                    content: 'Hi',
                    senderId: 'user123',
                    receiverId: 'user456',
                    listingId: 'listing1',
                    isRead: true,
                    createdAt: new Date(),
                    sender: { id: 'user123', name: 'User 1' },
                    receiver: { id: 'user456', name: 'User 2' },
                    listing: { id: 'listing1', title: 'Test Item', images: [] }
                }
            ];

            mockPrisma.message.findMany.mockResolvedValue(mockMessages);

            const response = await request(app)
                .get('/api/messages/conversations');

            expect(response.status).toBe(200);
            expect(response.body.length).toBe(1); // Should be grouped into one conversation
        });
    });

    describe('GET /api/messages/conversation/:listingId/:otherUserId', () => {
        it('should return messages for a specific conversation', async () => {
            const mockMessages = [
                {
                    id: 'msg1',
                    content: 'Hello',
                    senderId: 'user123',
                    receiverId: 'user456',
                    listingId: 'listing1',
                    createdAt: new Date(),
                    sender: { id: 'user123', name: 'User 1' },
                    receiver: { id: 'user456', name: 'User 2' }
                }
            ];

            mockPrisma.message.findMany.mockResolvedValue(mockMessages);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });

            const response = await request(app)
                .get('/api/messages/conversation/listing1/user456');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(mockPrisma.message.updateMany).toHaveBeenCalled(); // Should mark as read
        });
    });

    describe('POST /api/messages', () => {
        it('should send a message', async () => {
            const mockListing = { id: 'listing1', title: 'Test Item' };
            const mockReceiver = { id: 'user456', name: 'User 2' };
            const mockMessage = {
                id: 'msg1',
                content: 'Hello',
                senderId: 'user123',
                receiverId: 'user456',
                listingId: 'listing1',
                createdAt: new Date(),
                sender: { id: 'user123', name: 'User 1' },
                receiver: { id: 'user456', name: 'User 2' },
                listing: { id: 'listing1', title: 'Test Item' }
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.user.findUnique.mockResolvedValue(mockReceiver);
            mockPrisma.message.create.mockResolvedValue(mockMessage);

            const response = await request(app)
                .post('/api/messages')
                .send({
                    content: 'Hello',
                    receiverId: 'user456',
                    listingId: 'listing1'
                });

            expect(response.status).toBe(201);
            expect(response.body.content).toBe('Hello');
        });

        it('should reject message if listing not found', async () => {
            mockPrisma.listing.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/messages')
                .send({
                    content: 'Hello',
                    receiverId: 'user456',
                    listingId: 'nonexistent'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Listing not found');
        });

        it('should reject message if receiver not found', async () => {
            mockPrisma.listing.findUnique.mockResolvedValue({ id: 'listing1' });
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/messages')
                .send({
                    content: 'Hello',
                    receiverId: 'nonexistent',
                    listingId: 'listing1'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Receiver not found');
        });
    });

    describe('PUT /api/messages/mark-read/:conversationId', () => {
        it('should mark messages as read', async () => {
            mockPrisma.message.updateMany.mockResolvedValue({ count: 3 });

            const response = await request(app)
                .put('/api/messages/mark-read/conv1')
                .send({
                    listingId: 'listing1',
                    otherUserId: 'user456'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Messages marked as read');
        });
    });

    describe('DELETE /api/messages/conversation/:listingId/:otherUserId', () => {
        it('should delete a conversation', async () => {
            mockPrisma.message.deleteMany.mockResolvedValue({ count: 5 });

            const response = await request(app)
                .delete('/api/messages/conversation/listing1/user456');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Conversation deleted successfully');
        });
    });
});
