import { HTTP_STATUS } from '@/constants/index.js';
import RateLimit from '@/models/RateLimit.js';

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
        // Extract IP. In Next.js App Router, rely on standard headers or req.ip if provided by deployment.
        const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
        const routePath = new URL(req.url).pathname;
        const cacheKey = `${ip}:${routePath}`;

        let rateLimitData = await RateLimit.findOne({ key: cacheKey });

        if (!rateLimitData) {
            // New record
            rateLimitData = await RateLimit.create({
                key: cacheKey,
                count: 1,
                resetAt: new Date(Date.now() + windowMs)
            });
        } else if (rateLimitData.resetAt <= new Date()) {
            // Window has expired — reset the counter for a fresh window
            rateLimitData.count = 1;
            rateLimitData.resetAt = new Date(Date.now() + windowMs);
            await rateLimitData.save();
        } else {
            // Within window — increment existing count
            rateLimitData.count += 1;
            await rateLimitData.save();
        }

        if (rateLimitData.count > limit) {
            return new Response(JSON.stringify({
                success: false,
                message: message
            }), {
                status: HTTP_STATUS.TOO_MANY_REQUESTS,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit,
                    'X-RateLimit-Remaining': 0,
                    'Retry-After': Math.ceil((rateLimitData.resetAt - Date.now()) / 1000)
                }
            });
        }

        // Proceed normally
        return null;
    };
};

export default rateLimit;
