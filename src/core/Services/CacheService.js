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
        this.lastStandardErrorMsg = null;
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
                this.standardClient = createClient({
                    url: REDIS.standard_url,
                    socket: {
                        reconnectStrategy: (retries) => {
                            if (retries > 20) {
                                return new Error('Redis connection retries exhausted');
                            }
                            return Math.min(retries * 500, 5000);
                        }
                    }
                });

                this.standardClient.on('ready', () => {
                    this.isStandardConnected = true;
                    this.lastStandardErrorMsg = null;
                });

                this.standardClient.on('connect', () => {
                    this.isStandardConnected = true;
                });

                this.standardClient.on('reconnecting', () => {
                    this.isStandardConnected = false;
                });

                this.standardClient.on('end', () => {
                    this.isStandardConnected = false;
                });

                this.standardClient.on('error', (err) => {
                    this.isStandardConnected = false;
                    const msg = err?.message || String(err);
                    if (this.lastStandardErrorMsg !== msg) {
                        this.lastStandardErrorMsg = msg;
                        getLogger().error({ err }, 'CacheService Standard Redis Client Error');
                    }
                });

                try {
                    await this.standardClient.connect();
                    this.isStandardConnected = true;
                } catch (err) {
                    this.isStandardConnected = false;
                    const msg = err?.message || String(err);
                    if (this.lastStandardErrorMsg !== msg) {
                        this.lastStandardErrorMsg = msg;
                        getLogger().error({ err }, 'Failed to connect to CacheService Standard Redis');
                    }
                }
            }
            this.isInitialized = true;
        } catch (error) {
            getLogger().error({ err: error }, '[CACHE] Failed to initialize Redis clients');
        }
    }

    async get(key) {
        await this.init();
        if (this.upstashClient) {
            try {
                const data = await this.upstashClient.get(key);
                if (data) {
                    return typeof data === 'string' ? JSON.parse(data) : data;
                }
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Upstash get error');
            }
        }
        if (this.isStandardConnected) {
            try {
                const data = await this.standardClient.get(key);
                return data ? JSON.parse(data) : null;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Standard get error');
            }
        }
        return null;
    }

    async set(key, value, ttlSeconds = 3600) {
        await this.init();
        let success = false;
        if (this.upstashClient) {
            try {
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                await this.upstashClient.set(key, stringValue, { ex: ttlSeconds });
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Upstash set error');
            }
        }
        if (this.isStandardConnected) {
            try {
                await this.standardClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Standard set error');
            }
        }
        return success ? DEFAULTS.TRUE : DEFAULTS.FALSE;
    }

    async delete(key) {
        await this.init();
        let success = false;
        if (this.upstashClient) {
            try {
                await this.upstashClient.del(key);
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Upstash delete error');
            }
        }
        if (this.isStandardConnected) {
            try {
                await this.standardClient.del(key);
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, key }, 'CacheService Standard delete error');
            }
        }
        return success ? DEFAULTS.TRUE : DEFAULTS.FALSE;
    }

    async del(key) {
        return this.delete(key);
    }

    async deletePattern(pattern) {
        await this.init();
        let success = false;
        if (this.upstashClient) {
            try {
                const keys = await this.upstashClient.keys(pattern);
                if (keys.length > 0) {
                    await this.upstashClient.del(...keys);
                }
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, pattern }, 'CacheService Upstash deletePattern error');
            }
        }
        if (this.isStandardConnected) {
            try {
                const keys = await this.standardClient.keys(pattern);
                if (keys.length > 0) {
                    await this.standardClient.del(...keys);
                }
                success = true;
            } catch (err) {
                if (err?.digest === 'DYNAMIC_SERVER_USAGE') throw err;
                getLogger().error({ err, pattern }, 'CacheService Standard deletePattern error');
            }
        }
        return success ? DEFAULTS.TRUE : DEFAULTS.FALSE;
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
