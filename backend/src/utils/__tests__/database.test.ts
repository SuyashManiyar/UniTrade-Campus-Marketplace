import { prisma } from '../database';

describe('Database Utility', () => {
    it('should export a prisma instance', () => {
        expect(prisma).toBeDefined();
        expect(prisma).toHaveProperty('user');
        expect(prisma).toHaveProperty('listing');
        expect(prisma).toHaveProperty('message');
    });

    it('should be a singleton instance', () => {
        const { prisma: prisma2 } = require('../database');
        expect(prisma).toBe(prisma2);
    });

    it('should have all required models', () => {
        const models = [
            'user',
            'listing',
            'bid',
            'message',
            'notification',
            'wishlist',
            'report',
            'review'
        ];

        models.forEach(model => {
            expect(prisma).toHaveProperty(model);
        });
    });
});
