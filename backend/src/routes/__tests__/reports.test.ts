import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    report: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn()
    },
    listing: {
        findUnique: jest.fn(),
        update: jest.fn()
    }
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock authentication middleware
const mockAuthMiddleware = jest.fn((req: any, res: any, next: any) => {
    req.user = {
        id: 'user123',
        email: 'test@umass.edu',
        role: 'STUDENT'
    };
    next();
});

jest.mock('../../middleware/auth', () => ({
    authenticateToken: mockAuthMiddleware
}));

// Import router after mocks
import reportsRouter from '../reports';

const app = express();
app.use(express.json());
app.use('/api/reports', reportsRouter);

describe('Reports Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset to default user
        mockAuthMiddleware.mockImplementation((req: any, res: any, next: any) => {
            req.user = {
                id: 'user123',
                email: 'test@umass.edu',
                role: 'STUDENT'
            };
            next();
        });
    });

    describe('POST /api/reports', () => {
        it('should create a report', async () => {
            const mockListing = { id: 'listing1', status: 'ACTIVE' };
            const mockReport = {
                id: 'report1',
                reporterId: 'user123',
                listingId: 'listing1',
                reason: 'SPAM',
                details: 'This is spam',
                createdAt: new Date()
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.report.findFirst.mockResolvedValue(null);
            mockPrisma.report.create.mockResolvedValue(mockReport);
            mockPrisma.report.count.mockResolvedValue(1);

            const response = await request(app)
                .post('/api/reports')
                .send({
                    listingId: 'listing1',
                    reason: 'SPAM',
                    details: 'This is spam'
                });

            expect(response.status).toBe(201);
            expect(response.body.reason).toBe('SPAM');
            expect(response.body.reportCount).toBe(1);
        });

        it('should return 400 if listing ID or reason missing', async () => {
            const response = await request(app)
                .post('/api/reports')
                .send({
                    reason: 'SPAM'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Listing ID and reason are required');
        });

        it('should return 404 if listing not found', async () => {
            mockPrisma.listing.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/reports')
                .send({
                    listingId: 'nonexistent',
                    reason: 'SPAM'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Listing not found');
        });

        it('should return 400 if user already reported', async () => {
            const mockListing = { id: 'listing1', status: 'ACTIVE' };
            const existingReport = {
                id: 'report1',
                reporterId: 'user123',
                listingId: 'listing1'
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.report.findFirst.mockResolvedValue(existingReport);

            const response = await request(app)
                .post('/api/reports')
                .send({
                    listingId: 'listing1',
                    reason: 'SPAM'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('You have already reported this listing');
        });

        it('should auto-moderate listing after 2 reports', async () => {
            const mockListing = { id: 'listing1', status: 'ACTIVE' };
            const mockReport = {
                id: 'report2',
                reporterId: 'user123',
                listingId: 'listing1',
                reason: 'SPAM'
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.report.findFirst.mockResolvedValue(null);
            mockPrisma.report.create.mockResolvedValue(mockReport);
            mockPrisma.report.count.mockResolvedValue(2);
            mockPrisma.listing.update.mockResolvedValue({
                ...mockListing,
                status: 'UNDER_REVIEW'
            });

            const response = await request(app)
                .post('/api/reports')
                .send({
                    listingId: 'listing1',
                    reason: 'SPAM'
                });

            expect(response.status).toBe(201);
            expect(response.body.autoAction).toBe('UNDER_REVIEW');
            expect(mockPrisma.listing.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { status: 'UNDER_REVIEW' }
                })
            );
        });
    });

    describe('GET /api/reports', () => {
        it('should return all reports for admin', async () => {
            // Mock admin user
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'admin1',
                    email: 'admin@umass.edu',
                    role: 'ADMIN'
                };
                next();
            });

            const mockReports = [
                {
                    id: 'report1',
                    reason: 'SPAM',
                    reporter: { id: 'user1', name: 'User 1', email: 'user1@umass.edu' },
                    listing: {
                        id: 'listing1',
                        title: 'Test',
                        status: 'UNDER_REVIEW',
                        seller: { id: 'seller1', name: 'Seller', email: 'seller@umass.edu' }
                    },
                    createdAt: new Date()
                }
            ];

            mockPrisma.report.findMany.mockResolvedValue(mockReports);

            const response = await request(app)
                .get('/api/reports');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should return 403 for non-admin users', async () => {
            const response = await request(app)
                .get('/api/reports');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin access required');
        });
    });

    describe('DELETE /api/reports/:id', () => {
        it('should delete report for admin', async () => {
            // Mock admin user
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'admin1',
                    email: 'admin@umass.edu',
                    role: 'ADMIN'
                };
                next();
            });

            const mockReport = {
                id: 'report1',
                listingId: 'listing1',
                listing: { id: 'listing1', status: 'UNDER_REVIEW' }
            };

            mockPrisma.report.findUnique.mockResolvedValue(mockReport);
            mockPrisma.report.delete.mockResolvedValue(mockReport);
            mockPrisma.report.count.mockResolvedValue(0);
            mockPrisma.listing.update.mockResolvedValue({
                id: 'listing1',
                status: 'ACTIVE'
            });

            const response = await request(app)
                .delete('/api/reports/report1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Report dismissed');
            expect(response.body.remainingReports).toBe(0);
        });

        it('should return 403 for non-admin users', async () => {
            const response = await request(app)
                .delete('/api/reports/report1');

            expect(response.status).toBe(403);
        });

        it('should return 404 if report not found', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'admin1',
                    email: 'admin@umass.edu',
                    role: 'ADMIN'
                };
                next();
            });

            mockPrisma.report.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .delete('/api/reports/nonexistent');

            expect(response.status).toBe(404);
        });
    });

    describe('POST /api/reports/dismiss-all/:listingId', () => {
        it('should dismiss all reports and restore listing', async () => {
            mockAuthMiddleware.mockImplementationOnce((req: any, res: any, next: any) => {
                req.user = {
                    id: 'admin1',
                    email: 'admin@umass.edu',
                    role: 'ADMIN'
                };
                next();
            });

            mockPrisma.report.deleteMany.mockResolvedValue({ count: 3 });
            mockPrisma.listing.findUnique.mockResolvedValue({
                id: 'listing1',
                status: 'UNDER_REVIEW'
            });
            mockPrisma.listing.update.mockResolvedValue({
                id: 'listing1',
                status: 'ACTIVE'
            });

            const response = await request(app)
                .post('/api/reports/dismiss-all/listing1');

            expect(response.status).toBe(200);
            expect(response.body.deletedCount).toBe(3);
            expect(mockPrisma.listing.update).toHaveBeenCalled();
        });

        it('should return 403 for non-admin users', async () => {
            const response = await request(app)
                .post('/api/reports/dismiss-all/listing1');

            expect(response.status).toBe(403);
        });
    });
});
