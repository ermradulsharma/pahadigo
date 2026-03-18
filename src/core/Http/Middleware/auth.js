import { verifyToken } from '@/helpers/jwt.js';
import User from '@/models/User.js';
import { USER_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

const authMiddleware = async (req) => {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { authorized: false, message: RESPONSE_MESSAGES.AUTH.NO_TOKEN };
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded) {
            return { authorized: false, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID };
        }

        // [SECURITY] Real-time status check to block suspended/deleted users
        const user = await User.findById(decoded.id).select('status deletedAt').lean();

        if (!user || user.deletedAt) {
            return { authorized: false, message: RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED };
        }

        // Check if the user is anything BUT active or pending
        if (user.status !== USER_STATUS.ACTIVE && user.status !== USER_STATUS.PENDING) {
            const messages = {
                [USER_STATUS.BLOCKED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_BLOCKED,
                [USER_STATUS.INACTIVE]: RESPONSE_MESSAGES.AUTH.ACCOUNT_INACTIVE,
                [USER_STATUS.SUSPENDED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED,
                [USER_STATUS.DELETED]: RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED
            };

            return {
                authorized: false,
                message: messages[user.status] || RESPONSE_MESSAGES.AUTH.UNAUTHORIZED
            };
        }

        return { authorized: true, user: decoded };

    } catch (error) {
        return { authorized: false, message: RESPONSE_MESSAGES.AUTH.AUTH_SERVICE_ERROR };
    }
};

export default authMiddleware;