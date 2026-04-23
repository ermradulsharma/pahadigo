import { USER_ROLES, AUTH_PROVIDERS, STATUS, RESPONSE_MESSAGES, VENDOR_STATUS, DEFAULTS } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import OTPService from '@/core/Services/Auth/User/OTPService.js';
import { generateToken } from '@/core/Helpers/jwt.js';
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;
import { getAppConfig } from '@/core/Lib/appConfig.js';

class AuthService {
  async initiateOTP({ identifier, role, termsAccepted }) {
    const existingUser = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (existingUser && existingUser.role === USER_ROLES.ADMIN) {
      throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
    }
    if (existingUser && termsAccepted) {
      existingUser.termsAccepted = DEFAULTS.TRUE;
      existingUser.termsAcceptedAt = new Date();
      await existingUser.save();
    }
    return await OTPService.generateOTP(identifier, role, { termsAccepted });
  }

  async authenticateWithOTP({ identifier, otp, targetRole }) {
    const otpRecord = await OTPService.verifyOTP(identifier, otp);
    if (!otpRecord) {
      throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_OTP);
    }

    const { termsAccepted } = otpRecord;
    const isTermsAccepted = termsAccepted === DEFAULTS.TRUE || termsAccepted === 'true';
    const isEmail = identifier.includes('@');
    const normalizedEmail = isEmail ? identifier.toLowerCase().trim() : null;
    const normalizedPhone = !isEmail ? identifier.trim() : null;

    let role = otpRecord.role;
    if (role === 'master') {
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      role = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
    }

    let user = await User.findOne({ $or: [{ email: normalizedEmail || identifier }, { phone: normalizedPhone || identifier }] });

    // Security Validation: Admins cannot use OTP Login
    if (user && user.role === USER_ROLES.ADMIN) {
      throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
    }

    let isNewUser = (!user || !user.isVerified);
    if (!user) {
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      const userRole = (role && validRoles.includes(role)) ? role : USER_ROLES.TRAVELLER;
      const payload = {
        role: userRole,
        isVerified: DEFAULTS.TRUE,
        authProvider: normalizedEmail ? AUTH_PROVIDERS.LOCAL : AUTH_PROVIDERS.PHONE,
        termsAccepted: isTermsAccepted,
        termsAcceptedAt: isTermsAccepted ? new Date() : null
      };
      if (normalizedEmail) payload.email = normalizedEmail;
      if (normalizedPhone) payload.phone = normalizedPhone;
      user = await User.create(payload);
    } else {
      if (isNewUser) {
        user.isVerified = DEFAULTS.TRUE;
        user.authProvider = normalizedEmail ? AUTH_PROVIDERS.LOCAL : AUTH_PROVIDERS.PHONE;
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (role && validRoles.includes(role) && user.role !== role) {
        user.role = role;
      }
      if (isTermsAccepted && !user.termsAccepted) {
        user.termsAccepted = DEFAULTS.TRUE;
        user.termsAcceptedAt = new Date();
      }
      if (user.isModified()) await user.save();
    }

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }

    const token = await generateToken({ id: user._id, role: user.role, identifier: user.email || user.phone });
    return { token, role: user.role, isNewUser, user, ...vendorData };
  }

  async authenticateWithGoogle(idToken, targetRole) {
    const config = await getAppConfig();
    const googleClientId = config.google?.client_id;
    if (!googleClientId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });
    let isNewUser = DEFAULTS.FALSE;

    if (!user) {
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
      user = await User.create({
        email, name, googleId, role: userRole, isVerified: DEFAULTS.TRUE, authProvider: AUTH_PROVIDERS.GOOGLE
      });
      isNewUser = DEFAULTS.TRUE;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = AUTH_PROVIDERS.GOOGLE;
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (targetRole && validRoles.includes(targetRole)) user.role = targetRole;
      if (user.isModified()) await user.save();
    }

    await this._handleDeactivation(user);
    let vendorData = user.role === USER_ROLES.VENDOR ? await this._getVendorStatus(user) : {};
    const token = await generateToken({ id: user._id, role: user.role, email: user.email });
    return { token, role: user.role, isNewUser, user, ...vendorData };
  }

  // Helper methods from old code
  async _getVendorStatus(user) {
    const businessProfile = await Vendor.findOne({ user: user._id });
    let status = businessProfile ? VENDOR_STATUS.UPLOAD_DOCUMENTS : VENDOR_STATUS.SET_PROFILE;
    if (businessProfile?.documents?.aadharCard?.length > 0 && businessProfile.documents.panCard?.url) {
      status = VENDOR_STATUS.COMPLETED;
    }
    return { businessProfileStatus: status, businessProfile };
  }

  async _handleDeactivation(user) {
    // 1. Status Activation Logic
    if (user.status === STATUS.INACTIVE) {
      user.status = STATUS.ACTIVE;
      await user.save();
    }

    // 2. Deletion/Recovery Logic
    if (user.deletedAt || user.status === STATUS.DELETED) {
      const isSelfDeleted = !user.deletedBy || (user.deletedBy.toString() === user._id.toString());

      if (isSelfDeleted) {
        // Restore account if user deleted it themselves
        user.deletedAt = DEFAULTS.NULL;
        user.deletedBy = DEFAULTS.NULL;
        user.status = STATUS.ACTIVE;
        user.deletedReason = DEFAULTS.NULL;
        await user.save();
      } else {
        // Block login if Admin deleted the account
        throw new Error(RESPONSE_MESSAGES.AUTH.ACCOUNT_DELETED);
      }
    }
  }

  async toggleRole(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);

    if (user.role === USER_ROLES.ADMIN) {
      throw new Error(RESPONSE_MESSAGES.AUTH.ADMIN_CANNOT_SWITCH);
    }

    const newRole = user.role === USER_ROLES.VENDOR ? USER_ROLES.TRAVELLER : USER_ROLES.VENDOR;
    user.role = newRole;
    await user.save();

    let vendorData = user.role === USER_ROLES.VENDOR ? await this._getVendorStatus(user) : {};
    return {
      success: DEFAULTS.TRUE,
      role: user.role,
      user: { ...user.toObject(), password: undefined },
      ...vendorData
    };
  }

  async upgradeToVendor(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    if (user.role === USER_ROLES.ADMIN) throw new Error(RESPONSE_MESSAGES.AUTH.ADMIN_CANNOT_SWITCH);
    if (user.role === USER_ROLES.VENDOR) throw new Error(RESPONSE_MESSAGES.AUTH.ALREADY_VENDOR);

    user.role = USER_ROLES.VENDOR;
    await user.save();

    const vendorData = await this._getVendorStatus(user);
    return { success: DEFAULTS.TRUE, role: user.role, user: { ...user.toObject(), password: undefined }, ...vendorData };
  }

  async downgradeToTraveller(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    if (user.role === USER_ROLES.ADMIN) throw new Error(RESPONSE_MESSAGES.AUTH.ADMIN_CANNOT_SWITCH);
    if (user.role === USER_ROLES.TRAVELLER) throw new Error(RESPONSE_MESSAGES.AUTH.ALREADY_TRAVELLER);

    user.role = USER_ROLES.TRAVELLER;
    await user.save();

    return { success: DEFAULTS.TRUE, role: user.role, user: { ...user.toObject(), password: undefined } };
  }
}

export default new AuthService();
