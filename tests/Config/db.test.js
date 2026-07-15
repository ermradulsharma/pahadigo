import { jest } from '@jest/globals';

jest.unstable_mockModule('mongoose', () => ({
    default: {
        connect: jest.fn(),
        models: {}
    }
}));

const { default: mongoose } = await import('mongoose');
const { default: connectDB } = await import('@/core/Config/db.js');

describe('Industry Standard: Database Configuration Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear global cache if needed, but here we can just test the promise logic
    });

    it('[Success] should connect to MongoDB using URI from env', async () => {
        process.env.MONGODB_URI = 'mongodb://test';
        const mockMongoose = { connection: {} };
        mongoose.connect.mockResolvedValue(mockMongoose);

        const conn = await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://test', { bufferCommands: false });
        expect(conn).toBe(mockMongoose);
    });

    it('[Failure] should throw error if MONGODB_URI is missing', async () => {
        const originalUri = process.env.MONGODB_URI;
        const originalEnv = process.env.NODE_ENV;
        delete process.env.MONGODB_URI;
        process.env.NODE_ENV = 'production';
        
        // Reset cache for this test
        global.mongoose = null;
        const { default: freshConnectDB } = await import(`@/core/Config/db.js?cache=${Date.now()}`);
        const RESPONSE_MESSAGES = (await import('@/core/Constants/index.js')).RESPONSE_MESSAGES;
        await expect(freshConnectDB()).rejects.toThrow(RESPONSE_MESSAGES.ERROR.GENERIC);

        process.env.MONGODB_URI = originalUri;
        process.env.NODE_ENV = originalEnv;
    });
});
