import { STATUS, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';
import { verifyToken } from '@/core/Helpers/jwt.js';
import User from '@/core/Models/User.js';
import CacheService from '@/core/Services/CacheService.js';
import { getLogger } from '@/core/Lib/logger.js';

const authMiddleware = async (req) => {
    try {
        let token = null;

        // 1. Authorization header (Bearer <token>)
        const authHeader = req?.headers?.get ? (req.headers.get('authorization') || '') : '';
        const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
        if (bearerMatch) {
            token = bearerMatch[1];
        }

        // 2. Query parameter (?token= or ?access_token=) - required for SSE (EventSource) & WebSockets
        if (!token && req?.url) {
            try {
                const url = new URL(req.url, 'http://localhost');
                token = url.searchParams.get('token') || url.searchParams.get('access_token');
            } catch {}
        }

        // 3. Cookies (fallback for cookie-based sessions / SSR)
        if (!token) {
            if (typeof req?.cookies?.get === 'function') {
                token = req.cookies.get('token')?.value;
            } else if (req?.headers?.get) {
                const cookieHeader = req.headers.get('cookie') || '';
                const cookieMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
                if (cookieMatch) {
                    token = decodeURIComponent(cookieMatch[1]);
                }
            }
        }

        if (!token) return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.NO_TOKEN };

        const decoded = await verifyToken(token);
        if (!decoded) return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID };

        // Check Redis for blacklisted JTI (logout / token revocation)
        if (decoded.jti) {
            try {
                const isBlacklisted = await CacheService.get(`blacklist:${decoded.jti}`);
                if (isBlacklisted) {
                    return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID };
                }
            } catch (cacheErr) {
                getLogger().error({ err: cacheErr, jti: decoded.jti }, '[AuthMiddleware] Redis token blacklist lookup failed');
            }
        }

        const user = await User.findById(decoded.id).select('status deletedAt role preferences').lean();

        const statusMap = {
            [STATUS.DELETED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED,
            [STATUS.BLOCKED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_BLOCKED,
            [STATUS.SUSPENDED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED,
        };

        const denialReason = (!user || user.deletedAt) ? RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED : statusMap[user.status];
        return denialReason ? { authorized: DEFAULTS.FALSE, message: denialReason } : { authorized: DEFAULTS.TRUE, user: { ...user, id: user._id.toString() } };
    } catch (error) {
        return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.AUTH_SERVICE_ERROR };
    }
};

export default authMiddleware;
