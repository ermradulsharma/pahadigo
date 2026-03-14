import { verifyToken } from '@/helpers/jwt.js';
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
    return { authorized: true, user: decoded };
};

export default authMiddleware;