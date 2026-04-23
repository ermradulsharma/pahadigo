import { HTTP_STATUS, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';
import RateLimit from '@/core/Models/RateLimit.js';
import { errorResponse } from '@/core/Helpers/response.js';

export const rateLimit = ({ limit = 5, windowMs = 60000, message = 'Too many requests. Please try again later.' }) => {
    return async (req) => {
        const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
        const cacheKey = `${ip}:${new URL(req.url).pathname}`;
        const rateData = (await RateLimit.findOne({ key: cacheKey })) || (await RateLimit.create({ key: cacheKey, count: 0, resetAt: new Date(Date.now() + windowMs) }));
        const isExpired = rateData.resetAt <= new Date();
        rateData.count = isExpired ? 1 : rateData.count + 1;
        rateData.resetAt = isExpired ? new Date(Date.now() + windowMs) : rateData.resetAt;
        await rateData.save();
        return rateData.count > limit ? errorResponse(HTTP_STATUS.TOO_MANY_REQUESTS, message, DEFAULTS.ARRAY, {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': Math.ceil((rateData.resetAt - Date.now()) / 1000).toString()
        }) : DEFAULTS.NULL;
    };
};

export default rateLimit;
