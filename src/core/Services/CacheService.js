import { Redis as UpstashRedis } from '@upstash/redis';
import { createClient } from 'redis';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getLogger } from '@/core/Lib/logger.js';
import { DEFAULTS } from '@/core/Constants/index.js';

class CacheService {
    constructor() {
        this.upstashClient = null;
        this.standardClient = null;
        this.isStandardConnected = false;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            const config = await getAppConfig();
            const REDIS = config.redis || {};

            if (REDIS.upstash_url && REDIS.upstash_token && !this.upstashClient) {
                this.upstashClient = new UpstashRedis({
                    url: REDIS.upstash_url,
                    token: REDIS.upstash_token,
                });
            } else if (!REDIS.upstash_url && !REDIS.standard_url) {
                getLogger().warn('[CACHE] Redis credentials not found. Caching disabled.');
            }

            if (REDIS.standard_url && !this.standardClient) {
                this.standardClient = createClient({ url: REDIS.standard_url });
                this.standardClient.on('error', (err) => getLogger().error({ err }, 'CacheService Standard Redis Client Error'));
                try {
                    await this.standardClient.connect();
                    this.isStandardConnected = true;
                } catch (err) {
                    getLogger().error({ err }, 'Failed to connect to CacheService Standard Redis');
                    this.isStandardConnected = false;
                }
            }
            this.isInitialized = true;
        } catch (error) {
            getLogger().error({ err: error }, '[CACHE] Failed to initialize Redis clients');
        }
    }

    async get(key) {
        await this.init();
        try {
            if (this.upstashClient) {
                const data = await this.upstashClient.get(key);
                // upstash automatically parses json sometimes, but just in case:
                return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
            } else if (this.isStandardConnected) {
                const data = await this.standardClient.get(key);
                return data ? JSON.parse(data) : null;
            }
        } catch (err) {
            if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
            getLogger().error({ err, key }, 'CacheService get error');
        }
        return null;
    }

    async set(key, value, ttlSeconds = 3600) {
        await this.init();
        try {
            if (this.upstashClient) {
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                await this.upstashClient.set(key, stringValue, { ex: ttlSeconds });
                return DEFAULTS.TRUE;
            } else if (this.isStandardConnected) {
                await this.standardClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
                return DEFAULTS.TRUE;
            }
        } catch (err) {
            if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
            getLogger().error({ err, key }, 'CacheService set error');
        }
        return DEFAULTS.FALSE;
    }

    async delete(key) {
        await this.init();
        try {
            if (this.upstashClient) {
                await this.upstashClient.del(key);
                return DEFAULTS.TRUE;
            } else if (this.isStandardConnected) {
                await this.standardClient.del(key);
                return DEFAULTS.TRUE;
            }
        } catch (err) {
            if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
            getLogger().error({ err, key }, 'CacheService delete error');
        }
        return DEFAULTS.FALSE;
    }

    async del(key) {
        return this.delete(key);
    }

    async deletePattern(pattern) {
        await this.init();
        try {
            if (this.upstashClient) {
                const keys = await this.upstashClient.keys(pattern);
                if (keys.length > 0) {
                    await this.upstashClient.del(...keys);
                }
                return DEFAULTS.TRUE;
            } else if (this.isStandardConnected) {
                const keys = await this.standardClient.keys(pattern);
                if (keys.length > 0) {
                    await this.standardClient.del(...keys);
                }
                return DEFAULTS.TRUE;
            }
        } catch (err) {
            if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
            getLogger().error({ err, pattern }, 'CacheService deletePattern error');
        }
        return DEFAULTS.FALSE;
    }

    async getOrSet(key, fetchFn, ttlSeconds = 3600) {
        const cached = await this.get(key);
        if (cached) return cached;

        const fresh = await fetchFn();
        if (fresh) await this.set(key, fresh, ttlSeconds);
        return fresh;
    }
}

export default new CacheService();
