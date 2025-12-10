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



  });

  describe('GET /api/listings/:id', () => {


    it('should return 404 for non-existent listing', async () => {
      mockPrisma.listing.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/listings/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Listing not found');
    });
  });




});


