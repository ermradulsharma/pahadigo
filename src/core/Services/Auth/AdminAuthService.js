import User from '@/models/User.js';
import { generateToken } from '@/helpers/jwt.js';
import { USER_ROLES, RESPONSE_MESSAGES, STATUS } from '@/constants/index.js';

class AdminAuthService {
  async authenticateWithPassword({ email, password, rememberMe = false }) {
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
      user.deletedAt = null;
      user.deletedBy = null;
      user.deletedReason = null;
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
    return true;
  }

  async updatePassword(userId, newPassword) {
    return this.resetPassword(userId, newPassword);
  }
}

export default new AdminAuthService();
