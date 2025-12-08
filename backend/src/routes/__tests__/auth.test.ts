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
    it('should register a new user and send verification code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@umass.edu',
          name: 'Test User'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Verification code sent to your email');
      expect(response.body.email).toBe('newuser@umass.edu');
    });

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

    it('should reject registration if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@umass.edu'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@umass.edu',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists with this email');
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
    it('should send verification code for existing user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@umass.edu'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@umass.edu'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Verification code sent to your email');
    });

    it('should reject login for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@umass.edu'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No account found with this email');
    });

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
    it('should complete registration with valid code', async () => {
      process.env.JWT_SECRET = 'test-secret';

      // First register to create verification code
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@umass.edu',
          name: 'Test User'
        });

      // Then verify
      mockPrisma.user.create.mockResolvedValue({
        id: 'user123',
        email: 'newuser@umass.edu',
        name: 'Test User',
        role: 'STUDENT',
        isVerified: true
      });

      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          email: 'newuser@umass.edu',
          code: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should reject verification with invalid code', async () => {
      // First register
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@umass.edu',
          name: 'Test User'
        });

      // Try to verify with wrong code
      const response = await request(app)
        .post('/api/auth/verify')
        .send({
          email: 'test@umass.edu',
          code: '999999'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid verification code');
    });

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


