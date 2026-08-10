import { Redis as UpstashRedis } from '@upstash/redis';
import { createClient } from 'redis';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getLogger } from '@/core/Lib/logger.js';

class CacheService {
  constructor() {
    this.upstashClient = null;
    this.standardClient = null;
    this.isStandardConnected = false;
  }

  async init() {
    const config = await getAppConfig();
    const REDIS = config.redis || {};

    if (REDIS.upstash_url && REDIS.upstash_token && !this.upstashClient) {
      this.upstashClient = new UpstashRedis({
        url: REDIS.upstash_url,
        token: REDIS.upstash_token,
      });
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
  }

  async get(key) {
    await this.init();
    try {
      if (this.upstashClient) {
        return await this.upstashClient.get(key);
      } else if (this.isStandardConnected) {
        const data = await this.standardClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      getLogger().error({ err, key }, 'CacheService get error');
    }
    return null;
  }

  async set(key, value, ttlSeconds = 3600) {
    await this.init();
    try {
      if (this.upstashClient) {
        await this.upstashClient.set(key, value, { ex: ttlSeconds });
      } else if (this.isStandardConnected) {
        await this.standardClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
      }
    } catch (err) {
      getLogger().error({ err, key }, 'CacheService set error');
    }
  }

  async del(key) {
    await this.init();
    try {
      if (this.upstashClient) {
        await this.upstashClient.del(key);
      } else if (this.isStandardConnected) {
        await this.standardClient.del(key);
      }
    } catch (err) {
      getLogger().error({ err, key }, 'CacheService del error');
    }
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
