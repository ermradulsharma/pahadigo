import { verifyToken } from '@/helpers/jwt.js';
import User from '@/models/User.js';
import { USER_STATUS } from '@/constants/index.js';

const authMiddleware = async (req) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, message: 'No token provided' };
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return { authorized: false, message: 'Invalid token' };
    }

    // [SECURITY] Real-time status check to block suspended/deleted users
    const user = await User.findById(decoded.id).select('status deletedAt');
    if (!user || user.deletedAt) {
        return { authorized: false, message: 'Your account is suspended or deleted.' };
    }
    if (user.status !== USER_STATUS.ACTIVE) {
        return { authorized: false, message: 'Your account is does not active. Please contact support.' };
    }

    return { authorized: true, user: decoded };
};

export default authMiddleware;