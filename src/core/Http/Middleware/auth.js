import { verifyToken } from '@/helpers/jwt.js';
import User from '@/models/User.js';
import { USER_STATUS } from '@/constants/index.js';

const authMiddleware = async (req) => {
    try {
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
        const user = await User.findById(decoded.id).select('status deletedAt').lean();
        
        if (!user || user.deletedAt) {
            return { authorized: false, message: 'Your account is suspended or deleted.' };
        }

        // Check if the user is anything BUT active
        if (user.status !== USER_STATUS.ACTIVE) {
            const messages = {
                [USER_STATUS.PENDING]: 'Your account is not active. Please contact support.',
                [USER_STATUS.BLOCKED]: 'Your account is blocked. Please contact support.',
                [USER_STATUS.INACTIVE]: 'Your account is inactive. Please contact support.',
                [USER_STATUS.SUSPENDED]: 'Your account is suspended. Please contact support.',
                [USER_STATUS.DELETED]: 'Your account is deleted. Please contact support.'
            };
            
            return { 
                authorized: false, 
                message: messages[user.status] || 'Your account is not allowed to access this resource.' 
            };
        }

        return { authorized: true, user: decoded };
        
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return { authorized: false, message: 'Authentication Service Error' };
    }
};

export default authMiddleware;