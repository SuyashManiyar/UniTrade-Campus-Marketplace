import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma first
const mockPrisma = {
    wishlist: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn()
    },
    listing: {
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
import wishlistRouter from '../wishlist';

const app = express();
app.use(express.json());
app.use('/api/wishlist', wishlistRouter);

describe('Wishlist Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/wishlist', () => {
        it('should return user wishlist', async () => {
            const mockWishlist = [
                {
                    id: 'wish1',
                    userId: 'user123',
                    listingId: 'listing1',
                    createdAt: new Date(),
                    listing: {
                        id: 'listing1',
                        title: 'Test Item',
                        price: 100,
                        status: 'ACTIVE',
                        seller: { id: 'seller1', name: 'Seller', rating: 4.5, ratingCount: 10 },
                        bids: []
                    }
                }
            ];

            mockPrisma.wishlist.findMany.mockResolvedValue(mockWishlist);

            const response = await request(app)
                .get('/api/wishlist');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });

        it('should exclude sold/cancelled/expired listings', async () => {
            mockPrisma.wishlist.findMany.mockResolvedValue([]);

            await request(app).get('/api/wishlist');

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        listing: {
                            status: {
                                notIn: ['SOLD', 'CANCELLED', 'EXPIRED']
                            }
                        }
                    })
                })
            );
        });
    });

    describe('POST /api/wishlist/:listingId', () => {
        it('should add item to wishlist', async () => {
            const mockListing = { id: 'listing1', title: 'Test Item' };
            const mockWishlistItem = {
                id: 'wish1',
                userId: 'user123',
                listingId: 'listing1',
                createdAt: new Date()
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.wishlist.findUnique.mockResolvedValue(null);
            mockPrisma.wishlist.create.mockResolvedValue(mockWishlistItem);

            const response = await request(app)
                .post('/api/wishlist/listing1');

            expect(response.status).toBe(201);
            expect(response.body.listingId).toBe('listing1');
        });

        it('should return 404 if listing not found', async () => {
            mockPrisma.listing.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/wishlist/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Listing not found');
        });

        it('should return 400 if already in wishlist', async () => {
            const mockListing = { id: 'listing1', title: 'Test Item' };
            const existingWishlistItem = {
                id: 'wish1',
                userId: 'user123',
                listingId: 'listing1'
            };

            mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
            mockPrisma.wishlist.findUnique.mockResolvedValue(existingWishlistItem);

            const response = await request(app)
                .post('/api/wishlist/listing1');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Item already in wishlist');
        });
    });

    describe('DELETE /api/wishlist/:listingId', () => {
        it('should remove item from wishlist', async () => {
            mockPrisma.wishlist.delete.mockResolvedValue({
                id: 'wish1',
                userId: 'user123',
                listingId: 'listing1'
            });

            const response = await request(app)
                .delete('/api/wishlist/listing1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Removed from wishlist');
        });
    });

    describe('GET /api/wishlist/check/:listingId', () => {
        it('should return true if item is in wishlist', async () => {
            mockPrisma.wishlist.findUnique.mockResolvedValue({
                id: 'wish1',
                userId: 'user123',
                listingId: 'listing1'
            });

            const response = await request(app)
                .get('/api/wishlist/check/listing1');

            expect(response.status).toBe(200);
            expect(response.body.inWishlist).toBe(true);
        });

        it('should return false if item is not in wishlist', async () => {
            mockPrisma.wishlist.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/wishlist/check/listing1');

            expect(response.status).toBe(200);
            expect(response.body.inWishlist).toBe(false);
        });
    });
});
