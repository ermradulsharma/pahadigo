import { STATUS, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';
import { verifyToken } from '@/core/Helpers/jwt.js';
import User from '@/core/Models/User.js';

const authMiddleware = async (req) => {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const token = authHeader.startsWith('Bearer ') && authHeader.split(' ')[1];
        if (!token) return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.NO_TOKEN };

        const decoded = await verifyToken(token);
        if (!decoded) return { authorized: DEFAULTS.FALSE, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID };

        const user = await User.findById(decoded.id).select('status deletedAt role').lean();

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
