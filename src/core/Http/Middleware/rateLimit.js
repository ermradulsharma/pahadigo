import { HTTP_STATUS, DEFAULTS } from '@/core/Constants/index.js';
import RateLimit from '@/core/Models/RateLimit.js';
import { errorResponse } from '@/core/Helpers/response.js';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';
import { createClient } from 'redis';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getLogger } from '@/core/Lib/logger.js';

// --- Upstash Ratelimit Setup ---
const upstashRateLimiters = new Map();
const getUpstashRateLimiter = (limit, windowMs, upstashUrl, upstashToken) => {
    const key = `${limit}_${windowMs}_${upstashUrl}`;
    if (!upstashRateLimiters.has(key)) {
        const redis = new UpstashRedis({
            url: upstashUrl,
            token: upstashToken,
        });
        const limiter = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
            ephemeralCache: new Map(), // optional local cache
        });
        upstashRateLimiters.set(key, limiter);
    }
    return upstashRateLimiters.get(key);
};

// --- Standard Redis Setup ---
let standardRedisClient = null;
let isStandardRedisConnected = false;
let lastStandardRedisUrl = null;
const getStandardRedisClient = async (redisUrl) => {
    if (redisUrl) {
        if (!standardRedisClient || lastStandardRedisUrl !== redisUrl) {
            try {
                if (standardRedisClient) await standardRedisClient.disconnect();
                standardRedisClient = createClient({ url: redisUrl });
                standardRedisClient.on('error', (err) => getLogger().error({ err }, 'Standard Redis Client Error'));
                await standardRedisClient.connect();
                isStandardRedisConnected = true;
                lastStandardRedisUrl = redisUrl;
            } catch (err) {
                getLogger().error({ err }, 'Failed to connect to Standard Redis');
                isStandardRedisConnected = false;
            }
        }
        return isStandardRedisConnected ? standardRedisClient : null;
    }
    return null;
};

export const rateLimit = ({ limit = 5, windowMs = 60000, message = 'Too many requests. Please try again later.' }) => {
    return async (req) => {
        const config = await getAppConfig();
        const REDIS = config.redis || {};
        
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = req.ip || (forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1');
        const cacheKey = `${ip}:${new URL(req.url).pathname}`;
        
        // 1. Try Upstash Redis (REST) First (Best for Next.js Serverless)
        if (REDIS.upstash_url && REDIS.upstash_token) {
            try {
                const limiter = getUpstashRateLimiter(limit, windowMs, REDIS.upstash_url, REDIS.upstash_token);
                const { success, pending, limit: _limit, remaining, reset } = await limiter.limit(cacheKey);
                
                if (!success) {
                    return errorResponse(HTTP_STATUS.TOO_MANY_REQUESTS, message, DEFAULTS.ARRAY, {
                        'X-RateLimit-Limit': _limit.toString(),
                        'X-RateLimit-Remaining': remaining.toString(),
                        'Retry-After': Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString()
                    });
                }
                return DEFAULTS.NULL;
            } catch (error) {
                getLogger().error({ err: error }, 'Upstash Redis Ratelimit Error, falling back...');
            }
        }

        // 2. Try Standard Redis (TCP) Second
        if (REDIS.standard_url) {
            try {
                const client = await getStandardRedisClient(REDIS.standard_url);
                if (client) {
                    const currentWindow = Math.floor(Date.now() / windowMs);
                    const redisKey = `ratelimit:${cacheKey}:${currentWindow}`;
                    
                    const multi = client.multi();
                    multi.incr(redisKey);
                    multi.expire(redisKey, Math.ceil(windowMs / 1000) * 2); // Buffer TTL
                    const results = await multi.exec();
                    
                    const currentCount = results[0];
                    if (currentCount > limit) {
                        const resetAt = (currentWindow + 1) * windowMs;
                        return errorResponse(HTTP_STATUS.TOO_MANY_REQUESTS, message, DEFAULTS.ARRAY, {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': '0',
                            'Retry-After': Math.max(0, Math.ceil((resetAt - Date.now()) / 1000)).toString()
                        });
                    }
                    return DEFAULTS.NULL;
                }
            } catch (error) {
                getLogger().error({ err: error }, 'Standard Redis Ratelimit Error, falling back to MongoDB...');
            }
        }

        // Fallback to MongoDB
        const now = new Date();
        const nextResetAt = new Date(now.getTime() + windowMs);

        try {
            const rateData = await RateLimit.findOneAndUpdate(
                { key: cacheKey },
                [
                    {
                        $set: {
                            count: {
                                $cond: [
                                    { $or: [{ $not: ['$resetAt'] }, { $lte: ['$resetAt', now] }] },
                                    1,
                                    { $add: [{ $ifNull: ['$count', 0] }, 1] }
                                ]
                            },
                            resetAt: {
                                $cond: [
                                    { $or: [{ $not: ['$resetAt'] }, { $lte: ['$resetAt', now] }] },
                                    nextResetAt,
                                    '$resetAt'
                                ]
                            }
                        }
                    }
                ],
                { upsert: DEFAULTS.TRUE, returnDocument: 'after', setDefaultsOnInsert: DEFAULTS.TRUE, updatePipeline: true }
            );

            return rateData.count > limit ? errorResponse(HTTP_STATUS.TOO_MANY_REQUESTS, message, DEFAULTS.ARRAY, {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': '0',
                'Retry-After': Math.max(0, Math.ceil((rateData.resetAt - Date.now()) / 1000)).toString()
            }) : DEFAULTS.NULL;
        } catch (dbError) {
            // Gracefully handle E11000 concurrent upsert collision
            if (dbError.code === 11000) {
                return DEFAULTS.NULL;
            }
            getLogger().error({ err: dbError }, 'MongoDB Ratelimit Error');
            return DEFAULTS.NULL; // Fail open to not block valid traffic if DB struggles
        }
    };
};

export default rateLimit;
