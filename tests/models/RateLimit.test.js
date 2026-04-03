import RateLimit from '../../src/core/Models/RateLimit.js';
import mongoose from 'mongoose';

describe('RateLimit Model', () => {
    
    beforeEach(async () => {
        await RateLimit.deleteMany({});
        await RateLimit.syncIndexes();
    });

    it('should create a rate limit bucket', async () => {
        const resetAt = new Date();
        resetAt.setHours(resetAt.getHours() + 1);

        const limit = await RateLimit.create({
            key: 'auth_login:127.0.0.1',
            count: 1,
            resetAt
        });

        expect(limit.key).toBe('auth_login:127.0.0.1');
        expect(limit.count).toBe(1);
    });

    it('should fail on duplicate keys', async () => {
        const resetAt = new Date();
        await RateLimit.create({ key: 'test', resetAt });
        const dupe = new RateLimit({ key: 'test', resetAt });
        await expect(dupe.save()).rejects.toThrow();
    });
});
