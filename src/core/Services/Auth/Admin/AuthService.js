import User from '@/core/Models/User.js';
import BaseAuthService from '@/core/Services/Auth/BaseAuthService.js';
import CacheService from '@/core/Services/CacheService.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getUserBy, getUserById } from '@/core/Helpers/queryHelpers.js';
import { USER_ROLES, RESPONSE_MESSAGES, STATUS, DEFAULTS } from '@/core/Constants/index.js';

class AuthService {
    async authenticateWithPassword({ email, password, rememberMe = DEFAULTS.FALSE }) {
        const failKey = `admin:login:fail:${(email || '').toLowerCase()}`;
        const failedAttempts = (await CacheService.get(failKey)) || 0;

        if (failedAttempts >= 5) {
            throw AppError.forbidden("Too many failed login attempts. Account temporarily locked for 15 minutes.");
        }

        const user = await getUserBy({ email }, '+password', null, { lean: false });
        if (!user) {
            await CacheService.set(failKey, failedAttempts + 1, 900);
            throw AppError.unauthorized(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        // Security Validation: Only Admins can use Password Login
        if (user.role !== USER_ROLES.ADMIN) {
            throw AppError.forbidden(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        }

        // Check if user has password set
        if (!user.password) {
            throw AppError.badRequest(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            await CacheService.set(failKey, failedAttempts + 1, 900);
            throw AppError.unauthorized(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        // Reset failed login attempts on success
        await CacheService.del(failKey);

        await this._handleDeactivation(user);

        const tokens = await BaseAuthService.generateAndSaveTokens(user, rememberMe);

        return {
            tokens,
            user: { ...user.toObject(), password: undefined },
            role: user.role
        };
    }

    async _handleDeactivation(user) {
        if (user.status === STATUS.SUSPENDED) throw AppError.forbidden(RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED);
        if (user.status === STATUS.BLOCKED) throw AppError.forbidden(RESPONSE_MESSAGES.AUTH.ACCOUNT_BLOCKED);

        if (!user.deletedAt && user.status !== STATUS.DELETED) return;

        const isSelfDeleted = user.deletedBy && user.deletedBy.toString() === user._id.toString();

        if (isSelfDeleted) {
            user.deletedAt = DEFAULTS.NULL;
            user.deletedBy = DEFAULTS.NULL;
            user.deletedReason = DEFAULTS.NULL;
            user.status = STATUS.ACTIVE;
            await user.save();
            return;
        }

        throw AppError.forbidden(RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED);
    }

    async initiatePasswordReset(email) {
        const user = await getUserBy({ email });
        if (!user) throw AppError.notFound(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT };
    }

    async resetPassword(userId, newPassword) {
        const user = await getUserById(userId, '', null, { lean: false });
        if (!user) throw AppError.notFound(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        user.password = newPassword;
        await user.save();
        return DEFAULTS.TRUE;
    }

    async updatePassword(userId, newPassword) {
        return this.resetPassword(userId, newPassword);
    }
}

export default new AuthService();
