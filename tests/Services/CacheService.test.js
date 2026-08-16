import { jest } from '@jest/globals';

const mockUpstashGet = jest.fn();
const mockUpstashSet = jest.fn();
const mockUpstashDel = jest.fn();
const mockUpstashKeys = jest.fn();

jest.unstable_mockModule('@upstash/redis', () => ({
    Redis: class {
        constructor() {
            this.get = mockUpstashGet;
            this.set = mockUpstashSet;
            this.del = mockUpstashDel;
            this.keys = mockUpstashKeys;
        }
    }
}));

const mockStandardConnect = jest.fn();
const standardListeners = {};
const mockStandardOn = jest.fn((event, handler) => {
    standardListeners[event] = handler;
});
const mockStandardGet = jest.fn();
const mockStandardSet = jest.fn();
const mockStandardDel = jest.fn();
const mockStandardKeys = jest.fn();

jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => ({
        connect: mockStandardConnect,
        on: mockStandardOn,
        get: mockStandardGet,
        set: mockStandardSet,
        del: mockStandardDel,
        keys: mockStandardKeys
    }))
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn()
}));

const mockError = jest.fn();
const mockWarn = jest.fn();

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: () => ({
        error: mockError,
        warn: mockWarn
    })
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    DEFAULTS: { TRUE: true, FALSE: false }
}));

const { getAppConfig } = await import('@/core/Lib/appConfig.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');

describe('CacheService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        for (const key of Object.keys(standardListeners)) {
            delete standardListeners[key];
        }
        CacheService.upstashClient = null;
        CacheService.standardClient = null;
        CacheService.isStandardConnected = false;
        CacheService.isInitialized = false;
        CacheService.lastStandardErrorMsg = null;
    });

    describe('init', () => {
        it('should initialize Upstash client if config exists', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'token' } });
            await CacheService.init();
            expect(CacheService.upstashClient).toBeDefined();
            expect(CacheService.standardClient).toBeNull();
        });

        it('should initialize standard client if config exists', async () => {
            getAppConfig.mockResolvedValue({ redis: { standard_url: 'std_url' } });
            mockStandardConnect.mockResolvedValue();
            await CacheService.init();
            expect(CacheService.upstashClient).toBeNull();
            expect(CacheService.standardClient).toBeDefined();
            expect(CacheService.isStandardConnected).toBe(true);
        });

        it('should handle lifecycle events and suppress duplicate error logs', async () => {
            getAppConfig.mockResolvedValue({ redis: { standard_url: 'std_url' } });
            mockStandardConnect.mockResolvedValue();
            await CacheService.init();

            // Fire reconnecting event
            standardListeners.reconnecting();
            expect(CacheService.isStandardConnected).toBe(false);

            // Fire error event with message
            const err1 = new Error('ECONNRESET');
            standardListeners.error(err1);
            expect(CacheService.isStandardConnected).toBe(false);
            expect(mockError).toHaveBeenCalledTimes(1);

            // Duplicate error event with same message should be suppressed
            standardListeners.error(err1);
            expect(mockError).toHaveBeenCalledTimes(1);

            // Fire ready event to recover connection
            standardListeners.ready();
            expect(CacheService.isStandardConnected).toBe(true);
        });

        it('should warn if no credentials found', async () => {
            getAppConfig.mockResolvedValue({ redis: {} });
            await CacheService.init();
            expect(mockWarn).toHaveBeenCalledWith('[CACHE] Redis credentials not found. Caching disabled.');
        });
    });

    describe('get', () => {
        it('should get from Upstash', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            mockUpstashGet.mockResolvedValue(JSON.stringify({ a: 1 }));
            const result = await CacheService.get('key');
            expect(result.a).toBe(1);
        });

        it('should get from standard redis', async () => {
            getAppConfig.mockResolvedValue({ redis: { standard_url: 'url' } });
            mockStandardConnect.mockResolvedValue();
            mockStandardGet.mockResolvedValue(JSON.stringify({ b: 2 }));
            const result = await CacheService.get('key');
            expect(result.b).toBe(2);
        });
    });

    describe('set', () => {
        it('should set in Upstash', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            mockUpstashSet.mockResolvedValue();
            const result = await CacheService.set('key', { val: 1 });
            expect(mockUpstashSet).toHaveBeenCalledWith('key', JSON.stringify({ val: 1 }), { ex: 3600 });
            expect(result).toBe(true);
        });

        it('should set in standard redis', async () => {
            getAppConfig.mockResolvedValue({ redis: { standard_url: 'url' } });
            mockStandardConnect.mockResolvedValue();
            mockStandardSet.mockResolvedValue();
            const result = await CacheService.set('key', { val: 1 });
            expect(mockStandardSet).toHaveBeenCalledWith('key', JSON.stringify({ val: 1 }), { EX: 3600 });
            expect(result).toBe(true);
        });
    });

    describe('delete', () => {
        it('should delete from Upstash', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            const result = await CacheService.delete('key');
            expect(mockUpstashDel).toHaveBeenCalledWith('key');
            expect(result).toBe(true);
        });
    });

    describe('deletePattern', () => {
        it('should delete multiple keys from Upstash', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            mockUpstashKeys.mockResolvedValue(['k1', 'k2']);
            await CacheService.deletePattern('k*');
            expect(mockUpstashDel).toHaveBeenCalledWith('k1', 'k2');
        });
    });

    describe('getOrSet', () => {
        it('should return from cache if exists', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            mockUpstashGet.mockResolvedValue(JSON.stringify({ val: 'cached' }));
            const fetchFn = jest.fn();
            const result = await CacheService.getOrSet('key', fetchFn);
            expect(result.val).toBe('cached');
            expect(fetchFn).not.toHaveBeenCalled();
        });

        it('should fetch and set if not in cache', async () => {
            getAppConfig.mockResolvedValue({ redis: { upstash_url: 'url', upstash_token: 'tok' } });
            mockUpstashGet.mockResolvedValue(null);
            const fetchFn = jest.fn().mockResolvedValue({ val: 'fresh' });
            
            const result = await CacheService.getOrSet('key', fetchFn);
            expect(fetchFn).toHaveBeenCalled();
            expect(mockUpstashSet).toHaveBeenCalled();
            expect(result.val).toBe('fresh');
        });
    });
});
