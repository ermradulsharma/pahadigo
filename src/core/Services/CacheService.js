import { Redis as UpstashRedis } from '@upstash/redis';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { DEFAULTS } from '@/core/Constants/index.js';

class CacheService {
    constructor() {
        this.redisClient = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return this.redisClient;

        try {
            const config = await getAppConfig();
            const REDIS = config.redis || {};

            if (REDIS.upstash_url && REDIS.upstash_token) {
                this.redisClient = new UpstashRedis({
                    url: REDIS.upstash_url,
                    token: REDIS.upstash_token,
                });
                this.isInitialized = true;
            } else {
                console.warn('[CACHE] Upstash Redis credentials not found. Caching disabled.');
            }
        } catch (error) {
            console.error('[CACHE] Failed to initialize Upstash Redis:', error);
        }

        return this.redisClient;
    }

    /**
     * Get a value from the cache
     * @param {string} key 
     * @returns {any|null}
     */
    async get(key) {
        try {
            const client = await this.init();
            if (!client) return null;

            const data = await client.get(key);
            return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
        } catch (error) {
            console.error(`[CACHE GET ERROR] Key: ${key}`, error);
            return null; // Fallback to DB smoothly
        }
    }

    /**
     * Set a value in the cache with optional TTL
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlSeconds Default 1 hour (3600s)
     */
    async set(key, value, ttlSeconds = 3600) {
        try {
            const client = await this.init();
            if (!client) return DEFAULTS.FALSE;

            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await client.set(key, stringValue, { ex: ttlSeconds });
            return DEFAULTS.TRUE;
        } catch (error) {
            return DEFAULTS.FALSE;
        }
    }

    /**
     * Delete a value from the cache
     * @param {string} key 
     */
    async delete(key) {
        try {
            const client = await this.init();
            if (!client) return DEFAULTS.FALSE;

            await client.del(key);
            return DEFAULTS.TRUE;
        } catch (error) {
            return DEFAULTS.FALSE;
        }
    }

    /**
     * Alias for delete
     */
    async del(key) {
        return this.delete(key);
    }

    /**
     * Delete values from the cache matching a pattern
     * @param {string} pattern 
     */
    async deletePattern(pattern) {
        try {
            const client = await this.init();
            if (!client) return DEFAULTS.FALSE;

            const keys = await client.keys(pattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
            return DEFAULTS.TRUE;
        } catch (error) {
            return DEFAULTS.FALSE;
        }
    }
}

export default new CacheService();
