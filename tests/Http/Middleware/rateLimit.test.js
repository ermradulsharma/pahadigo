import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    HTTP_STATUS: { TOO_MANY_REQUESTS: 429 },
    DEFAULTS: { NULL: null, ARRAY: [], TRUE: true }
}));

jest.unstable_mockModule('@/core/Models/RateLimit.js', () => ({
    default: {
        findOneAndUpdate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/response.js', () => ({
    errorResponse: jest.fn((status, msg, data, headers) => ({ status, msg, headers }))
}));

const mockLimit = jest.fn();
jest.unstable_mockModule('@upstash/ratelimit', () => ({
    Ratelimit: class {
        constructor() { this.limit = mockLimit; }
        static fixedWindow = jest.fn()
    }
}));

jest.unstable_mockModule('@upstash/redis', () => ({
    Redis: class {}
}));

const mockConnect = jest.fn();
const mockMulti = jest.fn();
const mockDisconnect = jest.fn();
jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => ({
        connect: mockConnect,
        disconnect: mockDisconnect,
        on: jest.fn(),
        multi: mockMulti
    }))
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn()
}));

const mockError = jest.fn();
jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: () => ({ error: mockError })
}));

const { rateLimit } = await import('@/core/Http/Middleware/rateLimit.js');
const { getAppConfig } = await import('@/core/Lib/appConfig.js');
const { default: RateLimit } = await import('@/core/Models/RateLimit.js');

describe('RateLimit Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getAppConfig.mockResolvedValue({ redis: {} });
    });

    const createReq = () => ({
        headers: { get: () => '1.2.3.4' },
        url: 'http://localhost/api/test',
        ip: '1.2.3.4'
    });

    it('should use MongoDB fallback if no redis config and succeed if under limit', async () => {
        RateLimit.findOneAndUpdate.mockResolvedValue({ count: 1, resetAt: new Date() });
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result).toBeNull();
    });

    it('should use MongoDB fallback and block if over limit', async () => {
        RateLimit.findOneAndUpdate.mockResolvedValue({ count: 6, resetAt: new Date(Date.now() + 10000) });
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result.status).toBe(429);
        expect(result.headers['Retry-After']).toBeDefined();
    });

    it('should fail open (return null) if MongoDB fails', async () => {
        RateLimit.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result).toBeNull();
        expect(mockError).toHaveBeenCalled();
    });

    it('should handle MongoDB 11000 duplicate key error gracefully', async () => {
        const error = new Error('Dup');
        error.code = 11000;
        RateLimit.findOneAndUpdate.mockRejectedValue(error);
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result).toBeNull();
    });

    it('should use Upstash Redis if configured and succeed', async () => {
        getAppConfig.mockResolvedValue({ redis: { upstash_url: 'u', upstash_token: 't' } });
        mockLimit.mockResolvedValue({ success: true, pending: Promise.resolve(), limit: 5, remaining: 4, reset: Date.now() + 10000 });
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result).toBeNull();
    });

    it('should use Upstash Redis and block if over limit', async () => {
        getAppConfig.mockResolvedValue({ redis: { upstash_url: 'u', upstash_token: 't' } });
        mockLimit.mockResolvedValue({ success: false, limit: 5, remaining: 0, reset: Date.now() + 10000 });
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result.status).toBe(429);
    });

    it('should use standard Redis if configured and succeed', async () => {
        getAppConfig.mockResolvedValue({ redis: { standard_url: 'redis://localhost' } });
        mockConnect.mockResolvedValue();
        const mockExec = jest.fn().mockResolvedValue([1]);
        mockMulti.mockReturnValue({ incr: jest.fn(), expire: jest.fn(), exec: mockExec });
        
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result).toBeNull();
    });

    it('should use standard Redis and block if over limit', async () => {
        getAppConfig.mockResolvedValue({ redis: { standard_url: 'redis://localhost' } });
        mockConnect.mockResolvedValue();
        const mockExec = jest.fn().mockResolvedValue([6]); // Over limit of 5
        mockMulti.mockReturnValue({ incr: jest.fn(), expire: jest.fn(), exec: mockExec });
        
        const middleware = rateLimit({ limit: 5 });
        const result = await middleware(createReq());
        expect(result.status).toBe(429);
    });
});
