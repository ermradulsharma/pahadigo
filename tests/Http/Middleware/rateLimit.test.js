import { jest } from '@jest/globals';
import RateLimit from '@/core/Models/RateLimit.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';

// Use unstable_mockModule for ESM Models
jest.unstable_mockModule('@/core/Models/RateLimit.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

const { default: rateLimit } = await import('@/middleware/rateLimit.js');
const { default: RateLimitMock } = await import('@/core/Models/RateLimit.js');

describe('Core Middleware: RateLimit', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            ip: '127.0.0.1',
            url: 'http://localhost/api/test',
            headers: { get: () => null }
        };
    });

    test('should allow request if under limit', async () => {
        const middleware = rateLimit({ limit: 2, windowMs: 1000 });
        const mockData = {
            count: 1,
            resetAt: new Date(Date.now() + 1000)
        };
        RateLimitMock.findOneAndUpdate.mockResolvedValue(mockData);

        const result = await middleware(mockReq);

        expect(result).toBeNull();
        expect(RateLimitMock.findOneAndUpdate).toHaveBeenCalledWith(
            { key: '127.0.0.1:/api/test' },
            expect.any(Array),
            expect.objectContaining({ upsert: true, returnDocument: 'after', updatePipeline: true })
        );
    });

    test('should block request if over limit', async () => {
        const middleware = rateLimit({ limit: 1, windowMs: 1000 });
        const mockData = {
            count: 2,
            resetAt: new Date(Date.now() + 1000)
        };
        RateLimitMock.findOneAndUpdate.mockResolvedValue(mockData);

        const result = await middleware(mockReq);
        const body = await result.json();

        expect(result.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
        expect(body.message).toContain('Too many requests');
    });

    test('should reset count if window expired', async () => {
        const middleware = rateLimit({ limit: 5, windowMs: 1000 });
        const mockData = {
            count: 1,
            resetAt: new Date(Date.now() + 1000)
        };
        RateLimitMock.findOneAndUpdate.mockResolvedValue(mockData);

        const result = await middleware(mockReq);

        expect(result).toBeNull();
        expect(mockData.count).toBe(1);
    });
});
