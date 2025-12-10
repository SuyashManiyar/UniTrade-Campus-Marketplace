import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    review: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn()
    },
    listing: {
        findMany: jest.fn(),
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
import usersRouter from '../users';

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users/profile', () => {
        it('should return current user profile', async () => {
            const mockUser = {
                id: 'user123',
                email: 'test@umass.edu',
                name: 'Test User',
                pronouns: 'they/them',
                major: 'Computer Science',
                location: 'Amherst',
                bio: 'Test bio',
                role: 'STUDENT',
                rating: 4.5,
                ratingCount: 10,
                createdAt: new Date(),
                _count: {
                    listings: 5,
                    receivedReviews: 10
                }
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(200);
            expect(response.body.email).toBe('test@umass.edu');
            expect(response.body.name).toBe('Test User');
        });

        it('should return 404 if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/users/profile');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User not found');
        });
    });

    describe('PUT /api/users/profile', () => {
        it('should update user profile', async () => {
            const updatedUser = {
                id: 'user123',
                email: 'test@umass.edu',
                name: 'Updated Name',
                pronouns: 'she/her',
                major: 'Biology',
                location: 'Northampton',
                bio: 'Updated bio',
                role: 'STUDENT',
                rating: 4.5,
                ratingCount: 10,
                createdAt: new Date()
            };

            mockPrisma.user.update.mockResolvedValue(updatedUser);

            const response = await request(app)
                .put('/api/users/profile')
                .send({
                    name: 'Updated Name',
                    pronouns: 'she/her',
                    major: 'Biology',
                    location: 'Northampton',
                    bio: 'Updated bio'
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Name');
            expect(response.body.major).toBe('Biology');
        });

        it('should reject invalid data', async () => {
            const response = await request(app)
                .put('/api/users/profile')
                .send({
                    name: '' // Empty name should fail validation
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return public user profile', async () => {
            const mockUser = {
                id: 'user456',
                name: 'Other User',
                pronouns: 'he/him',
                major: 'Math',
                location: 'Amherst',
                bio: 'Test bio',
                rating: 4.8,
                ratingCount: 20,
                createdAt: new Date(),
                _count: {
                    listings: 10,
                    receivedReviews: 20
                }
            };

            mockPrisma.user.findUnique.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/users/user456');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Other User');
            expect(response.body.email).toBeUndefined(); // Email should not be in public profile
        });

        it('should return 404 if user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/users/nonexistent');

            expect(response.status).toBe(404);
        });
    });

    describe('GET /api/users/:id/reviews', () => {
        it('should return user reviews with pagination', async () => {
            const mockReviews = [
                {
                    id: 'review1',
                    rating: 5,
                    comment: 'Great seller!',
                    revieweeId: 'user456',
                    reviewerId: 'user123',
                    reviewer: { id: 'user123', name: 'Reviewer' },
                    createdAt: new Date()
                }
            ];

            mockPrisma.review.findMany.mockResolvedValue(mockReviews);
            mockPrisma.review.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/users/user456/reviews')
                .query({ page: '1', limit: '10' });

            expect(response.status).toBe(200);
            expect(response.body.reviews).toBeDefined();
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBe(1);
        });
    });

    describe('POST /api/users/reviews', () => {
        it('should create a review', async () => {
            const mockReview = {
                id: 'review1',
                rating: 5,
                comment: 'Great seller!',
                reviewerId: 'user123',
                revieweeId: 'user456',
                reviewer: { id: 'user123', name: 'Reviewer' },
                createdAt: new Date()
            };

            const mockReviewee = {
                id: 'user456',
                name: 'Reviewee'
            };

            mockPrisma.review.findUnique.mockResolvedValue(null);
            mockPrisma.user.findUnique.mockResolvedValue(mockReviewee);
            mockPrisma.review.create.mockResolvedValue(mockReview);
            mockPrisma.review.findMany.mockResolvedValue([mockReview]);
            mockPrisma.user.update.mockResolvedValue({
                ...mockReviewee,
                rating: 5,
                ratingCount: 1
            });

            const response = await request(app)
                .post('/api/users/reviews')
                .send({
                    rating: 5,
                    comment: 'Great seller!',
                    revieweeId: 'user456'
                });

            expect(response.status).toBe(201);
            expect(response.body.rating).toBe(5);
        });

        it('should reject self-review', async () => {
            const response = await request(app)
                .post('/api/users/reviews')
                .send({
                    rating: 5,
                    revieweeId: 'user123' // Same as authenticated user
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Cannot review yourself');
        });

        it('should reject duplicate review', async () => {
            const existingReview = {
                id: 'review1',
                reviewerId: 'user123',
                revieweeId: 'user456'
            };

            mockPrisma.review.findUnique.mockResolvedValue(existingReview);

            const response = await request(app)
                .post('/api/users/reviews')
                .send({
                    rating: 5,
                    revieweeId: 'user456'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('You have already reviewed this user');
        });

        it('should reject invalid rating', async () => {
            const response = await request(app)
                .post('/api/users/reviews')
                .send({
                    rating: 6, // Invalid: must be 1-5
                    revieweeId: 'user456'
                });

            expect(response.status).toBe(400);
        });

        it('should return 404 if reviewee not found', async () => {
            mockPrisma.review.findUnique.mockResolvedValue(null);
            mockPrisma.user.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/users/reviews')
                .send({
                    rating: 5,
                    revieweeId: 'nonexistent'
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User to review not found');
        });
    });

    describe('GET /api/users/:id/listings', () => {
        it('should return user listings with pagination', async () => {
            const mockListings = [
                {
                    id: 'listing1',
                    title: 'Test Item',
                    price: 100,
                    status: 'ACTIVE',
                    sellerId: 'user456',
                    bids: []
                }
            ];

            mockPrisma.listing.findMany.mockResolvedValue(mockListings);
            mockPrisma.listing.count.mockResolvedValue(1);

            const response = await request(app)
                .get('/api/users/user456/listings')
                .query({ page: '1', limit: '10' });

            expect(response.status).toBe(200);
            expect(response.body.listings).toBeDefined();
            expect(response.body.pagination).toBeDefined();
        });

        it('should only return active listings', async () => {
            mockPrisma.listing.findMany.mockResolvedValue([]);
            mockPrisma.listing.count.mockResolvedValue(0);

            await request(app)
                .get('/api/users/user456/listings');

            expect(mockPrisma.listing.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'ACTIVE'
                    })
                })
            );
        });
    });
});
