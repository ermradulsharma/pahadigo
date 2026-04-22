import { verifyToken } from '@/helpers/jwt.js';
import User from '@/models/User.js';
import { STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

const authMiddleware = async (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, message: RESPONSE_MESSAGES.AUTH.NO_TOKEN };
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return { authorized: false, message: RESPONSE_MESSAGES.AUTH.TOKEN_INVALID };
    }

    const user = await User.findById(decoded.id).select('status deletedAt role').lean();
    const blockedStatuses = [STATUS.DELETED, STATUS.BLOCKED, STATUS.SUSPENDED];
    if (!user || user.deletedAt || blockedStatuses.includes(user.status)) {
      return { authorized: false, message: RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED };
    }

    return { authorized: true, user: { ...user, id: user._id.toString() } };

  } catch (error) {
    return { authorized: false, message: RESPONSE_MESSAGES.AUTH.AUTH_SERVICE_ERROR };
  }
};

export default authMiddleware;
