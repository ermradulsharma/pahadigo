import { jest } from '@jest/globals';

const mockUpstashGet = jest.fn();
const mockUpstashSet = jest.fn();
const mockUpstashDel = jest.fn();
const mockUpstashKeys = jest.fn();

jest.unstable_mockModule('@upstash/redis', () => ({
    Redis: jest.fn().mockImplementation(() => ({
        get: mockUpstashGet,
        set: mockUpstashSet,
        del: mockUpstashDel,
        keys: mockUpstashKeys
    }))
}));

jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn().mockReturnValue({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(true),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        keys: jest.fn()
    })
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        redis: {
            upstash_url: 'https://test-redis.upstash.io',
            upstash_token: 'test_token'
        }
    })
}));

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: jest.fn().mockReturnValue({
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    })
}));

const { default: cacheService } = await import('@/core/Services/CacheService.js');

describe('CacheService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('get & set operations', () => {
        it('should set and get values using Upstash client', async () => {
            mockUpstashSet.mockResolvedValue('OK');
            mockUpstashGet.mockResolvedValue(JSON.stringify({ user: 'john' }));

            const setRes = await cacheService.set('user:1', { user: 'john' }, 1800);
            expect(setRes).toBe(true);

            const getRes = await cacheService.get('user:1');
            expect(getRes).toEqual({ user: 'john' });
        });

        it('should return null when cache key is not found', async () => {
            mockUpstashGet.mockResolvedValue(null);
            const res = await cacheService.get('missing:key');
            expect(res).toBeNull();
        });
    });

    describe('delete operations', () => {
        it('should delete a key successfully', async () => {
            mockUpstashDel.mockResolvedValue(1);
            const res = await cacheService.delete('user:1');
            expect(res).toBe(true);
        });

        it('should delete matching pattern keys', async () => {
            mockUpstashKeys.mockResolvedValue(['user:1', 'user:2']);
            mockUpstashDel.mockResolvedValue(2);

            const res = await cacheService.deletePattern('user:*');
            expect(res).toBe(true);
            expect(mockUpstashDel).toHaveBeenCalledWith('user:1', 'user:2');
        });
    });

    describe('getOrSet (Cache-Aside pattern)', () => {
        it('should return cached value if present without calling fetchFn', async () => {
            mockUpstashGet.mockResolvedValue(JSON.stringify({ cached: true }));
            const fetchFn = jest.fn();

            const res = await cacheService.getOrSet('test:key', fetchFn);
            expect(res).toEqual({ cached: true });
            expect(fetchFn).not.toHaveBeenCalled();
        });

        it('should call fetchFn and cache result if key is missing', async () => {
            mockUpstashGet.mockResolvedValue(null);
            mockUpstashSet.mockResolvedValue('OK');
            const fetchFn = jest.fn().mockResolvedValue({ fresh: true });

            const res = await cacheService.getOrSet('test:key', fetchFn, 600);
            expect(fetchFn).toHaveBeenCalled();
            expect(res).toEqual({ fresh: true });
        });
    });
});
