import { verifyToken } from '../helpers/jwt.js';
import { errorResponse, successResponse } from '../helpers/response.js';
const authMiddleware = async (req) => {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(401, 'No token provided', {});
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return errorResponse(401, 'Invalid token', {});
    }
    return successResponse(200, 'User authenticated', { user: decoded });
};

export default authMiddleware;
