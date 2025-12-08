import request from 'supertest';
import express from 'express';
import listingsRouter from '../listings';
import { authenticateToken } from '../../middleware/auth';
import jwt from 'jsonwebtoken';

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    // Mock authenticated user
    req.user = {
      id: 'user123',
      email: 'test@umass.edu',
      role: 'STUDENT'
    };
    next();
  }),
  requireUMassEmail: jest.fn((req: any, res: any, next: any) => next())
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    listing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    bid: {
      create: jest.fn(),
      groupBy: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  }))
}));

// Mock Socket.IO
jest.mock('../../socket/socket', () => ({
  emitBidUpdate: jest.fn(),
  emitListingUpdate: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/api/listings', listingsRouter);

describe('Listings Routes', () => {
  const { PrismaClient } = require('@prisma/client');
  const mockPrisma = new PrismaClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/listings', () => {
    it('should return list of active listings', async () => {
      const mockListings = [
        {
          id: 'listing1',
          title: 'Test Item',
          price: 100,
          status: 'ACTIVE',
          seller: { id: 'seller1', name: 'Seller' }
        }
      ];

      mockPrisma.listing.findMany.mockResolvedValue(mockListings);
      mockPrisma.listing.count = jest.fn().mockResolvedValue(1);

      const response = await request(app)
        .get('/api/listings')
        .query({ page: '1', limit: '20' });

      expect(response.status).toBe(200);
      expect(response.body.listings).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by category', async () => {
      mockPrisma.listing.findMany.mockResolvedValue([]);
      mockPrisma.listing.count = jest.fn().mockResolvedValue(0);

      const response = await request(app)
        .get('/api/listings')
        .query({ category: 'ELECTRONICS' });

      expect(response.status).toBe(200);
      expect(mockPrisma.listing.findMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return a single listing', async () => {
      const mockListing = {
        id: 'listing1',
        title: 'Test Item',
        description: 'Test description',
        price: 100,
        seller: { id: 'seller1', name: 'Seller' },
        bids: []
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);

      const response = await request(app)
        .get('/api/listings/listing1');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('listing1');
    });

    it('should return 404 for non-existent listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/listings/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Listing not found');
    });
  });

  describe('POST /api/listings/:id/bid', () => {
    it('should place a bid on an auction listing', async () => {
      const mockListing = {
        id: 'listing1',
        type: 'AUCTION',
        status: 'ACTIVE',
        sellerId: 'seller1',
        startingBid: 50,
        currentBid: null,
        bidIncrement: 5,
        auctionEndTime: new Date(Date.now() + 86400000),
        bids: []
      };

      const mockBid = {
        id: 'bid1',
        amount: 55,
        bidderId: 'user123',
        listingId: 'listing1',
        createdAt: new Date(),
        bidder: { id: 'user123', name: 'Bidder' }
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);
      mockPrisma.bid.create.mockResolvedValue(mockBid);
      mockPrisma.listing.update.mockResolvedValue({
        ...mockListing,
        currentBid: 55,
        bids: [mockBid],
        _count: { bids: 1 }
      });

      const response = await request(app)
        .post('/api/listings/listing1/bid')
        .send({ amount: 55 });

      expect(response.status).toBe(201);
      expect(response.body.amount).toBe(55);
    });

    it('should reject bid on non-auction listing', async () => {
      const mockListing = {
        id: 'listing1',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: 'seller1'
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);

      const response = await request(app)
        .post('/api/listings/listing1/bid')
        .send({ amount: 100 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('This is not an auction listing');
    });

    it('should reject bid below minimum', async () => {
      const mockListing = {
        id: 'listing1',
        type: 'AUCTION',
        status: 'ACTIVE',
        sellerId: 'seller1',
        startingBid: 50,
        currentBid: 50,
        bidIncrement: 5,
        auctionEndTime: new Date(Date.now() + 86400000),
        bids: []
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);

      const response = await request(app)
        .post('/api/listings/listing1/bid')
        .send({ amount: 52 }); // Less than minimum (50 + 5 = 55)

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Bid must be at least');
    });

    it('should reject bid on own listing', async () => {
      const mockListing = {
        id: 'listing1',
        type: 'AUCTION',
        status: 'ACTIVE',
        sellerId: 'user123', // Same as authenticated user
        startingBid: 50,
        bidIncrement: 5,
        auctionEndTime: new Date(Date.now() + 86400000),
        bids: []
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);

      const response = await request(app)
        .post('/api/listings/listing1/bid')
        .send({ amount: 55 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot bid on your own listing');
    });

    it('should reject bid on ended auction', async () => {
      const mockListing = {
        id: 'listing1',
        type: 'AUCTION',
        status: 'ACTIVE',
        sellerId: 'seller1',
        startingBid: 50,
        bidIncrement: 5,
        auctionEndTime: new Date(Date.now() - 86400000), // Past date
        bids: []
      };

      mockPrisma.listing.findUnique.mockResolvedValue(mockListing);

      const response = await request(app)
        .post('/api/listings/listing1/bid')
        .send({ amount: 55 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Auction has ended');
    });
  });

  describe('GET /api/listings/leaderboard/top-bidders', () => {
    it('should return top 10 bidders', async () => {
      const mockTopBidders = [
        {
          bidderId: 'user1',
          _sum: { amount: 1000 },
          _count: { id: 10 }
        }
      ];

      mockPrisma.bid.groupBy.mockResolvedValue(mockTopBidders);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        name: 'Top Bidder',
        rating: 4.5,
        ratingCount: 10
      });

      const response = await request(app)
        .get('/api/listings/leaderboard/top-bidders');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});


