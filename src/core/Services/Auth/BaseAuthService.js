import { RESPONSE_MESSAGES, USER_ROLES, STATUS, DEFAULTS } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { verifyToken, generateToken } from '@/core/Helpers/jwt.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';

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
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        }

        if (updates.preferences) {
            updates.preferences = {
                ...existingUser.preferences.toObject(),
                ...updates.preferences,
                notifications: {
                    ...existingUser.preferences.notifications,
                    ...(updates.preferences.notifications || {})
                }
            };
        }

        if (updates.address) {
            mapToGeoJSON(updates.address, 'location');
        }
        const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return user;
    }

    async deactivateUserAccount(userId, reason = DEFAULTS.NULL) {
        const updates = {
            deletedAt: new Date(),
            deletedBy: userId,
            deletedReason: reason,
            status: STATUS.DELETED
        };
        const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return DEFAULTS.TRUE;
    }
}

export default new BaseAuthService();
