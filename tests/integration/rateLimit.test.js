import { jest } from '@jest/globals';
import { HTTP_STATUS } from '@/core/Constants/index.js';

// We just mock the Redis RateLimit fallback (MongoDB) since we don't have Upstash keys in test env by default
jest.unstable_mockModule('@/core/Models/RateLimit.js', () => ({
    default: {
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        redis: { upstash_url: null, standard_url: null } // Fallback to Mongo
    })
}));

const { rateLimit } = await import('@/core/Http/Middleware/rateLimit.js');
const { default: RateLimit } = await import('@/core/Models/RateLimit.js');

describe('Integration: Rate Limiting Middleware', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            ip: '127.0.0.1',
            headers: { 
                'x-forwarded-for': '127.0.0.1',
                get: function(key) { return this[key]; }
            },
            url: 'http://localhost/api/v1/auth/login'
        };
    });

    it('should allow request if under limit', async () => {
        RateLimit.findOneAndUpdate.mockResolvedValue({ count: 1 }); 

        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(mockReq);

        expect(RateLimit.findOneAndUpdate).toHaveBeenCalled();
        expect(result).toBeNull(); // DEFAULTS.NULL means allow
    });

    it('should block request if over limit', async () => {
        RateLimit.findOneAndUpdate.mockResolvedValue({ count: 6, resetAt: Date.now() + 60000 }); 

        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(mockReq);

        expect(RateLimit.findOneAndUpdate).toHaveBeenCalled();
        expect(result).not.toBeNull();
        expect(result.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    });
});
