import { HTTP_STATUS, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';
import RateLimit from '@/core/Models/RateLimit.js';
import { errorResponse } from '@/core/Helpers/response.js';

export const rateLimit = ({ limit = 5, windowMs = 60000, message = 'Too many requests. Please try again later.' }) => {
    return async (req) => {
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ip = req.ip || forwardedFor?.split(',')[0]?.trim() || '127.0.0.1';
        const cacheKey = `${ip}:${new URL(req.url).pathname}`;
        const now = new Date();
        const nextResetAt = new Date(now.getTime() + windowMs);

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
    };
};

export default rateLimit;
