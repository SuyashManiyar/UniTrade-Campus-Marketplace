describe('Socket Utilities', () => {
    const mockEmit = jest.fn();
    const mockTo = jest.fn(() => ({ emit: mockEmit }));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('emitBidUpdate', () => {


        it('should not throw when io is not initialized', () => {
            const { emitBidUpdate } = require('../socket');

            // Ensure io is null
            const socketModule = require('../socket');
            socketModule.io = null;

            expect(() => {
                emitBidUpdate('listing123', { amount: 100 });
            }).not.toThrow();
        });
    });

    describe('emitListingUpdate', () => {


        it('should not throw when io is not initialized', () => {
            const { emitListingUpdate } = require('../socket');

            const socketModule = require('../socket');
            socketModule.io = null;

            expect(() => {
                emitListingUpdate('listing123', { title: 'Test' });
            }).not.toThrow();
        });
    });

    describe('getIO', () => {
        it('should throw error when socket not initialized', () => {
            const { getIO } = require('../socket');

            const socketModule = require('../socket');
            socketModule.io = null;

            expect(() => {
                getIO();
            }).toThrow('Socket.IO not initialized. Call initializeSocket first.');
        });


    });
});
