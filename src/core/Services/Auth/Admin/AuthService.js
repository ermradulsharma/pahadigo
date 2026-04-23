import User from '@/core/Models/User.js';
import { generateToken } from '@/core/Helpers/jwt.js';
import { USER_ROLES, RESPONSE_MESSAGES, STATUS, DEFAULTS } from '@/core/Constants/index.js';

class AuthService {
    async authenticateWithPassword({ email, password, rememberMe = DEFAULTS.FALSE }) {
        const user = await User.findOne({ email }).select('+password');
        if (!user) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

        // Security Validation: Only Admins can use Password Login
        if (user.role !== USER_ROLES.ADMIN) {
            throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        }

        // Check if user has password set
        if (!user.password) throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);

        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

        await this._handleDeactivation(user);

        const tokenExpiry = rememberMe ? '30d' : '1d';
        const token = await generateToken({ id: user._id, role: user.role, email: user.email }, tokenExpiry);

        return {
            token,
            user: { ...user.toObject(), password: undefined },
            role: user.role
        };
    }

    async _handleDeactivation(user) {
        if (user.status === STATUS.SUSPENDED) throw new Error(RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED);
        if (user.status === STATUS.BLOCKED) throw new Error(RESPONSE_MESSAGES.AUTH.ACCOUNT_BLOCKED);

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

        throw new Error(RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED);
    }

    async initiatePasswordReset(email) {
        const user = await User.findOne({ email });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return { message: RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT };
    }

    async resetPassword(userId, newPassword) {
        const user = await User.findById(userId);
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        user.password = newPassword;
        await user.save();
        return DEFAULTS.TRUE;
    }

    async updatePassword(userId, newPassword) {
        return this.resetPassword(userId, newPassword);
    }
}

export default new AuthService();
