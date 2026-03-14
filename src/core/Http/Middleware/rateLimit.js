import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class LRUCache {
    constructor(maxCount = 1000) {
        this.cache = new Map();
        this.maxCount = maxCount;
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        // Refresh usage
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val);
        return val;
    }

    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxCount) {
            // Drop oldest
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
}

const tokenCache = new LRUCache(1000);

/**
 * Creates a rate limiter middleware for Next.js Route Handlers.
 * @param {Object} options - Limiter options
 * @param {number} options.limit - Max requests per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.message - Error message
 * @returns {Function} Rate limiter function to wrap the handler
 */
export const rateLimit = ({ limit = 5, windowMs = 60000, message = 'Too many requests. Please try again later.' }) => {
    return async (req, handlerArgs) => {
        // Extract IP. In Next.js App Router, rely on standard headers or req.ip if provided by deployment (like Vercel).
        const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
        const routePath = new URL(req.url).pathname;
        const cacheKey = `${ip}:${routePath}`;

        const tokenData = tokenCache.get(cacheKey) || { count: 0, startTime: Date.now() };

        if (Date.now() - tokenData.startTime > windowMs) {
            // Reset window
            tokenData.count = 1;
            tokenData.startTime = Date.now();
        } else {
            tokenData.count++;
        }

        tokenCache.set(cacheKey, tokenData);

        if (tokenData.count > limit) {
            console.warn(`[RateLimit] Blocked request from ${ip} to ${routePath}`);
            return new Response(JSON.stringify({
                success: false,
                message: message
            }), {
                status: HTTP_STATUS.TOO_MANY_REQUESTS || 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit,
                    'X-RateLimit-Remaining': 0,
                    'Retry-After': Math.ceil((windowMs - (Date.now() - tokenData.startTime)) / 1000)
                }
            });
        }

        // Proceed normally
        return null;
    };
};
