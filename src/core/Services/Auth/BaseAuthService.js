import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import { verifyToken, generateToken } from '@/helpers/jwt.js';
import { RESPONSE_MESSAGES, USER_ROLES, STATUS } from '@/constants/index.js';

class BaseAuthService {
    async verifyToken(token) {
        const decoded = await verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);
        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) {
            const businessProfile = await Vendor.findOne({ user: user._id });
            vendorData = { businessProfile };
        }
        return { user, ...vendorData };
    }

    async refreshToken(token) {
        const decoded = await verifyToken(token);
        if (!decoded) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        const newToken = await generateToken({ id: decoded.id, role: decoded.role, email: decoded.email });
        return { token: newToken };
    }

    async getUserProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);
        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) {
            const businessProfile = await Vendor.findOne({ user: user._id });
            vendorData = { businessProfile };
        }
        return { ...user.toObject(), ...vendorData };
    }

    async updateUserProfile(userId, updates) {
        const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return user;
    }

    async deactivateUserAccount(userId, reason = null) {
        const updates = {
            deletedAt: new Date(),
            deletedBy: userId,
            deletedReason: reason,
            status: STATUS.DELETED
        };
        const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return true;
    }
}

export default new BaseAuthService();
