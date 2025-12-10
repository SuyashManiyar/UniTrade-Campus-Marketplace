import { registerSchema, loginSchema, listingSchema, bidSchema, messageSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@umass.edu',
        name: 'John Doe',
        pronouns: 'he/him',
        major: 'Computer Science',
        location: 'Amherst',
        bio: 'Test bio'
      };

      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject non-UMass email', () => {
      const invalidData = {
        email: 'test@gmail.com',
        name: 'John Doe'
      };

      expect(() => registerSchema.parse(invalidData)).toThrow('Must be a valid UMass email address');
    });

    it('should reject missing name', () => {
      const invalidData = {
        email: 'test@umass.edu'
      };

      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should accept optional fields', () => {
      const minimalData = {
        email: 'test@umass.edu',
        name: 'John Doe'
      };

      expect(() => registerSchema.parse(minimalData)).not.toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@umass.edu',
        code: '123456'
      };

      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        code: '123456'
      };

      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject code that is not 6 digits', () => {
      const invalidData = {
        email: 'test@umass.edu',
        code: '12345'
      };

      expect(() => loginSchema.parse(invalidData)).toThrow('Verification code must be 6 digits');
    });

    it('should reject code that is too long', () => {
      const invalidData = {
        email: 'test@umass.edu',
        code: '1234567'
      };

      expect(() => loginSchema.parse(invalidData)).toThrow('Verification code must be 6 digits');
    });
  });

  describe('listingSchema', () => {
    it('should validate correct listing data for direct sale', () => {
      const validData = {
        title: 'Test Item',
        description: 'Test description',
        category: 'ELECTRONICS',
        condition: 'GOOD',
        price: 100,
        type: 'DIRECT_SALE'
      };

      expect(() => listingSchema.parse(validData)).not.toThrow();
    });

    it('should validate correct listing data for auction', () => {
      const validData = {
        title: 'Test Auction',
        description: 'Test description',
        category: 'ELECTRONICS',
        condition: 'NEW',
        price: 50,
        type: 'AUCTION',
        startingBid: 50,
        bidIncrement: 5,
        auctionEndTime: new Date(Date.now() + 86400000).toISOString()
      };

      expect(() => listingSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative price', () => {
      const invalidData = {
        title: 'Test Item',
        description: 'Test description',
        category: 'ELECTRONICS',
        condition: 'GOOD',
        price: -100
      };

      expect(() => listingSchema.parse(invalidData)).toThrow('Price must be positive');
    });

    it('should reject invalid category', () => {
      const invalidData = {
        title: 'Test Item',
        description: 'Test description',
        category: 'INVALID',
        condition: 'GOOD',
        price: 100
      };

      expect(() => listingSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid condition', () => {
      const invalidData = {
        title: 'Test Item',
        description: 'Test description',
        category: 'ELECTRONICS',
        condition: 'INVALID',
        price: 100
      };

      expect(() => listingSchema.parse(invalidData)).toThrow();
    });

    it('should default to DIRECT_SALE if type not provided', () => {
      const data = {
        title: 'Test Item',
        description: 'Test description',
        category: 'ELECTRONICS',
        condition: 'GOOD',
        price: 100
      };

      const result = listingSchema.parse(data);
      expect(result.type).toBe('DIRECT_SALE');
    });
  });

  describe('bidSchema', () => {
    it('should validate correct bid data', () => {
      const validData = {
        amount: 100
      };

      expect(() => bidSchema.parse(validData)).not.toThrow();
    });

    it('should reject negative bid amount', () => {
      const invalidData = {
        amount: -10
      };

      expect(() => bidSchema.parse(invalidData)).toThrow('Bid amount must be positive');
    });

    it('should reject zero bid amount', () => {
      const invalidData = {
        amount: 0
      };

      expect(() => bidSchema.parse(invalidData)).toThrow('Bid amount must be positive');
    });

    it('should reject missing amount', () => {
      const invalidData = {};

      expect(() => bidSchema.parse(invalidData)).toThrow();
    });
  });

  describe('messageSchema', () => {
    it('should validate correct message data', () => {
      const validData = {
        content: 'Hello, is this still available?',
        receiverId: 'user123',
        listingId: 'listing123'
      };

      expect(() => messageSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty message content', () => {
      const invalidData = {
        content: '',
        receiverId: 'user123',
        listingId: 'listing123'
      };

      expect(() => messageSchema.parse(invalidData)).toThrow('Message content is required');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        content: 'Hello'
      };

      expect(() => messageSchema.parse(invalidData)).toThrow();
    });
  });
});


