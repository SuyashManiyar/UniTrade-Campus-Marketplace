import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    user: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn()
    },
    listing: {
        count: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    },
    report: {
        count: jest.fn(),
        deleteMany: jest.fn()
    },
    wishlist: {
        deleteMany: jest.fn()
    },
    message: {
        deleteMany: jest.fn()
    },
    bid: {
        deleteMany: jest.fn()
    },
    $transaction: jest.fn()
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock authentication middleware
const mockAuthMiddleware = jest.fn((req: any, res: any, next: any) => {
    req.user = {
        id: 'admin1',
        email: 'admin@umass.edu',
        role: 'ADMIN'
    };
    next();
});

jest.mock('../../middleware/auth', () => ({
    authenticateToken: mockAuthMiddleware
}));

// Import router after mocks
import adminRouter from '../admin';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset to admin user
        mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
            req.user = {
                id: 'admin1',
                email: 'admin@umass.edu',
                role: 'ADMIN'
            };
            next();
        });
    });

    describe('GET /api/admin/stats', () => {
        it('should return admin dashboard stats', async () => {
            mockPrisma.user.count.mockResolvedValue(100);
            mockPrisma.listing.count
                .mockResolvedValueOnce(50)
                .mockResolvedValueOnce(30);
            mockPrisma.report.count.mockResolvedValue(5);

            const response = await request(app)
                .get('/api/admin/stats');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                totalUsers: 100,
                totalListings: 50,
                activeListings: 30,
                totalReports: 5
            });
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .get('/api/admin/stats');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
        });
    });

    describe('GET /api/admin/users', () => {
        it('should return paginated users list', async () => {
            const mockUsers = [
                {
                    id: 'user1',
                    email: 'user1@umass.edu',
                    name: 'User 1',
                    role: 'STUDENT',
                    isVerified: true,
                    createdAt: new Date(),
                    _count: { listings: 5, receivedReviews: 10 }
                }
            ];

            mockPrisma.user.findMany.mockResolvedValue(mockUsers);
            mockPrisma.user.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/admin/users')
                .query({ page: '1', limit: '20' });

            expect(response.status).toBe(200);
            expect(response.body.users).toBeDefined();
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBe(1);
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .get('/api/admin/users');

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/admin/users/:id/role', () => {
        it('should update user role', async () => {
            const updatedUser = {
                id: 'user1',
                email: 'user1@umass.edu',
                name: 'User 1',
                role: 'STAFF'
            };

            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const response = await request(app)
                .put('/api/admin/users/user1/role')
                .send({ role: 'STAFF' });

            expect(response.status).toBe(200);
            expect(response.body.role).toBe('STAFF');
        });

        it('should reject invalid role', async () => {
            const response = await request(app)
                .put('/api/admin/users/user1/role')
                .send({ role: 'INVALID_ROLE' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid role');
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .put('/api/admin/users/user1/role')
                .send({ role: 'STAFF' });

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/admin/listings', () => {
        it('should return paginated listings', async () => {
            const mockListings = [
                {
                    id: 'listing1',
                    title: 'Test Item',
                    price: 100,
                    status: 'ACTIVE',
                    seller: {
                        id: 'seller1',
                        name: 'Seller',
                        email: 'seller@umass.edu'
                    },
                    createdAt: new Date()
                }
            ];

            mockPrisma.listing.findMany.mockResolvedValue(mockListings);
            mockPrisma.listing.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/admin/listings')
                .query({ page: '1', limit: '50' });

            expect(response.status).toBe(200);
            expect(response.body.listings).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .get('/api/admin/listings');

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/admin/listings/:id/status', () => {
        it('should update listing status', async () => {
            const updatedListing = {
                id: 'listing1',
                title: 'Test Item',
                status: 'SOLD',
                seller: {
                    id: 'seller1',
                    name: 'Seller',
                    email: 'seller@umass.edu'
                }
            };

            mockPrisma.listing.update.mockResolvedValue(updatedListing);

            const response = await request(app)
                .put('/api/admin/listings/listing1/status')
                .send({ status: 'SOLD' });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('SOLD');
        });

        it('should reject invalid status', async () => {
            const response = await request(app)
                .put('/api/admin/listings/listing1/status')
                .send({ status: 'INVALID_STATUS' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid status');
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .put('/api/admin/listings/listing1/status')
                .send({ status: 'SOLD' });

            expect(response.status).toBe(403);
        });
    });

    describe('DELETE /api/admin/listings/:id', () => {
        it('should delete listing and related records', async () => {
            mockPrisma.$transaction.mockResolvedValue([
                { count: 2 }, // wishlist
                { count: 1 }, // reports
                { count: 5 }, // messages
                { count: 3 }, // bids
                { id: 'listing1' } // listing
            ]);

            const response = await request(app)
                .delete('/api/admin/listings/listing1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Listing deleted successfully');
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });

        it('should return 403 for non-admin users', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'user123',
                    email: 'user@umass.edu',
                    role: 'STUDENT'
                };
                next();
            });

            const response = await request(app)
                .delete('/api/admin/listings/listing1');

            expect(response.status).toBe(403);
        });
    });
});
