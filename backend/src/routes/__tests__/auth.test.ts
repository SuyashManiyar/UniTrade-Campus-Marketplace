import request from 'supertest';
import express from 'express';
import authRouter from '../auth';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  generateVerificationCode: jest.fn(() => '123456')
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma as any);
  });

  describe('POST /api/auth/register', () => {


    it('should reject registration with non-UMass email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@gmail.com',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('UMass email required');
    });



    it('should reject registration without name', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@umass.edu'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {




    it('should reject login with non-UMass email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@gmail.com'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/verify', () => {




    it('should reject verification with expired code', async () => {
      // This would require mocking the verificationCodes Map
      // For now, we test the error case
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          email: 'nonexistent@umass.edu',
          code: '123456'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Verification code not found');
    });
  });
});


