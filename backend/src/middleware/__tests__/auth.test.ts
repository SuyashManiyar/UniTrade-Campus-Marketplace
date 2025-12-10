import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireUMassEmail, AuthRequest } from '../auth';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const MockedPrisma = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key';

    mockRequest = {
      headers: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    nextFunction = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token provided', async () => {
      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      await authenticateToken(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });






  });

  describe('requireUMassEmail', () => {
    it('should call next if email ends with @umass.edu', () => {
      mockRequest.body = {
        email: 'test@umass.edu'
      };

      requireUMassEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 if email does not end with @umass.edu', () => {
      mockRequest.body = {
        email: 'test@gmail.com'
      };

      requireUMassEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'UMass email required. Please use your @umass.edu email address.'
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 400 if email is missing', () => {
      mockRequest.body = {};

      requireUMassEmail(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});


