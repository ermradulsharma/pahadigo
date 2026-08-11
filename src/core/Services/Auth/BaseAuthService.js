import { RESPONSE_MESSAGES, USER_ROLES, STATUS, DEFAULTS } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { verifyToken, generateToken, generateAuthTokens, decodeToken } from '@/core/Helpers/jwt.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import CacheService from '@/core/Services/CacheService.js';

class BaseAuthService {
    async generateAndSaveTokens(user, rememberMe = false) {
        const payload = { id: user._id, role: user.role, email: user.email, identifier: user.email || user.phone };
        const tokens = await generateAuthTokens(payload, rememberMe);
        
        // Save refresh token JTI in Redis for validation/blacklisting. Key: auth:refresh:{userId}:{jti}
        const ttl = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // seconds
        await CacheService.set(`auth:refresh:${user._id}:${tokens.refreshJti}`, {
            createdAt: new Date().toISOString()
        }, ttl);

        return tokens;
    }

    async verifyToken(token) {
        const decoded = await verifyToken(token);
        const user = await User.findById(decoded.id).select('-password').lean();
        if (!user) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);
        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) {
            const businessProfile = await Vendor.findOne({ user: user._id }).lean();
            vendorData = { businessProfile };
        }
        return { user, ...vendorData };
    }

    async refreshToken(token) {
        const decoded = await verifyToken(token);
        if (!decoded || decoded.type !== 'refresh' || !decoded.jti) {
            throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }

        const cacheKey = `auth:refresh:${decoded.id}:${decoded.jti}`;
        const isValid = await CacheService.get(cacheKey);
        if (!isValid) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);

        const user = { _id: decoded.id, role: decoded.role, email: decoded.email, phone: decoded.identifier };
        const newTokens = await this.generateAndSaveTokens(user, true); // preserve long expiry on refresh

        // Invalidate old refresh token (Token Rotation)
        await CacheService.delete(cacheKey);

        return newTokens;
    }

    async logout(accessToken, refreshToken = null) {
        const accessDecoded = decodeToken(accessToken);
        if (!accessDecoded || !accessDecoded.id) return false;

        if (refreshToken) {
            const refreshDecoded = decodeToken(refreshToken);
            if (refreshDecoded && refreshDecoded.jti) {
                await CacheService.delete(`auth:refresh:${refreshDecoded.id}:${refreshDecoded.jti}`);
                return true;
            }
        }
        
        // Fallback: Invalidate all sessions for this user if no specific refresh token provided
        await CacheService.deletePattern(`auth:refresh:${accessDecoded.id}:*`);
        return true;
    }

    async getUserProfile(userId) {
        const user = await User.findById(userId).select('-password').lean();
        if (!user) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);
        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) {
            const businessProfile = await Vendor.findOne({ user: user._id }).lean();
            vendorData = { businessProfile };
        }
        return { ...user, ...vendorData };
    }

    async updateUserProfile(userId, updates) {
        const existingUser = await User.findById(userId);

        if (!existingUser) {
            throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        }

        // Security Whitelist: Strip sensitive security & role fields from updates
        const forbiddenFields = ['role', 'status', 'isVerified', 'isVendorVerified', 'deletedAt', 'deletedBy', 'deletedReason'];
        forbiddenFields.forEach(field => delete updates[field]);

        if (updates.preferences) {
            // Prevent tempRole injection via preferences
            const safePreferences = { ...updates.preferences };
            delete safePreferences.tempRole;

            const existingPrefs = existingUser.preferences?.toObject 
                ? existingUser.preferences.toObject() 
                : (existingUser.preferences || {});

            updates.preferences = {
                ...existingPrefs,
                ...safePreferences,
                notifications: {
                    ...(existingPrefs.notifications || {}),
                    ...(safePreferences.notifications || {})
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
