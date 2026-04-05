import User from '@/models/User.js';
import OTPService from '@/services/OTPService.js';
import { generateToken, verifyToken } from '@/helpers/jwt.js';
import { USER_ROLES, AUTH_PROVIDERS, STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;
import Vendor from '@/models/Vendor.js';
import jwt from 'jsonwebtoken';
import { getAppConfig } from '@/lib/appConfig';

class AuthService {
  async requestOtp({ identifier, role, termsAndConditionsAccepted }) {
    const existingUser = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (existingUser && existingUser.role === USER_ROLES.ADMIN) {
      throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
    }
    if (existingUser && (termsAndConditionsAccepted === true || termsAndConditionsAccepted === 'true')) {
      existingUser.termsAccepted = true;
      existingUser.termsAcceptedAt = new Date();
      await existingUser.save();
    }

    return await OTPService.generateOTP(identifier, role, { termsAccepted: termsAndConditionsAccepted });
  }

  async _getVendorStatus(user) {
    const businessProfile = await Vendor.findOne({ user: user._id });
    let status = "setBusinessProfile";
    let profile = null;

    if (businessProfile) {
      profile = businessProfile;
      status = "uploadDocuments";

      const docs = businessProfile.documents;
      if (docs) {
        const hasAadhar = Array.isArray(docs.aadharCard) && docs.aadharCard.length > 0 && (docs.aadharCard[0]?.url || docs.aadharCard[0]?.publicId);
        const hasPan = docs.panCard && (docs.panCard.url || docs.panCard.publicId);

        if (hasAadhar && hasPan) {
          status = "profileCompleted";
        }
      }
    }
    return { businessProfileStatus: status, businessProfile: profile };
  }

  async _handleDeactivation(user) {
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

  async deleteProfileById(userId, reason = null) {
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

  async loginWithPassword({ email, password, rememberMe = false }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

    // Security Validation: Only Admins can use Password Login
    if (user.role !== USER_ROLES.ADMIN) {
      throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
    }

    // Check if user has password set (might be social/OTP user trying password login)
    if (!user.password) throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }

    const tokenExpiry = rememberMe ? '30d' : '1d';
    const token = await generateToken({ id: user._id, role: user.role, email: user.email }, tokenExpiry);
    return {
      token,
      user: { ...user.toObject(), password: undefined },
      role: user.role,
      ...vendorData
    };
  }

  async verifyAndLogin({ identifier, otp, email, phone, targetRole }) {
    if (!email && !phone && identifier) {
      if (identifier.includes('@')) {
        email = identifier.toLowerCase().trim();
      } else {
        phone = identifier.trim();
      }
    }

    const otpRecord = await OTPService.verifyOTP(identifier, otp);
    if (!otpRecord) {
      throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_OTP);
    }

    const { termsAccepted } = otpRecord;
    const isTermsAccepted = termsAccepted === true || termsAccepted === 'true';
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
        isVerified: true,
        authProvider: normalizedEmail ? AUTH_PROVIDERS.LOCAL : AUTH_PROVIDERS.PHONE,
        termsAccepted: isTermsAccepted,
        termsAcceptedAt: isTermsAccepted ? new Date() : null
      };
      if (normalizedEmail) payload.email = normalizedEmail;
      if (normalizedPhone) payload.phone = normalizedPhone;
      user = await User.create(payload);
    } else {
      if (isNewUser) {
        user.isVerified = true;
        if (!user.authProvider || user.authProvider === 'none') {
          user.authProvider = normalizedEmail ? AUTH_PROVIDERS.LOCAL : AUTH_PROVIDERS.PHONE;
        }
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (role && validRoles.includes(role) && user.role !== role) {
        user.role = role;
      }
      if (isTermsAccepted && !user.termsAccepted) {
        user.termsAccepted = true;
        user.termsAcceptedAt = new Date();
      }
      if (user.isModified()) {
        await user.save();
      }
    }

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }
    const token = await generateToken({ id: user._id, role: user.role, identifier: user.email || user.phone });
    return {
      token,
      role: user.role,
      isNewUser,
      user,
      ...vendorData
    };
  }

  async googleAuth(idToken, targetRole) {
    const config = await getAppConfig();
    const googleClientId = config.google?.client_id;
    if (!googleClientId) {
      throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);
    }
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      const phonePlaceholder = `+00${Date.now()}`;
      const validRoles = ['traveller', 'vendor'];
      const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'traveller';
      user = await User.create({
        email,
        name,
        googleId,
        phone: phonePlaceholder,
        role: userRole,
        isVerified: true,
        authProvider: 'google'
      });
      isNewUser = true;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (targetRole && validRoles.includes(targetRole) && user.role !== targetRole) {
        user.role = targetRole;
      }
      if (user.isModified()) {
        await user.save();
      }
    }

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === 'vendor') {
      vendorData = await this._getVendorStatus(user);
    }

    const token = await generateToken({ id: user._id, role: user.role, email: user.email });
    return { token, role: user.role, isNewUser, user, ...vendorData };
  }

  async facebookAuth(accessToken, targetRole) {
    if (!accessToken) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    }

    const { id: facebookId, name, email } = data;
    const userEmail = email || `fb_${facebookId}@example.com`;

    let user = await User.findOne({ $or: [{ facebookId }, { email: userEmail }] });
    let isNewUser = false;

    if (!user) {
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
      user = await User.create({
        email: userEmail,
        name,
        facebookId,
        role: userRole,
        isVerified: true,
        authProvider: 'facebook'
      });
      isNewUser = true;
    } else {
      if (!user.facebookId) {
        user.facebookId = facebookId;
        if (user.authProvider === 'phone') user.authProvider = 'facebook';
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (targetRole && validRoles.includes(targetRole) && user.role !== targetRole) {
        user.role = targetRole;
      }
      if (user.isModified()) {
        await user.save();
      }
    }

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === 'vendor') {
      vendorData = await this._getVendorStatus(user);
    }

    const token = await generateToken({ id: user._id, role: user.role, email: user.email });
    return { token, role: user.role, isNewUser, user, ...vendorData };
  }

  async appleAuth(idToken, targetRole, userFn, userEmail) {
    if (!idToken) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

    const decoded = jwt.decode(idToken);
    if (!decoded || !decoded.sub) {
      throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    }

    const { sub: appleId, email: tokenEmail } = decoded;
    const email = userEmail || tokenEmail;
    const finalEmail = email || `apple_${appleId}@privaterelay.appleid.com`;

    let user = await User.findOne({ $or: [{ appleId }, { email: finalEmail }] });
    let isNewUser = false;

    if (!user) {
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;

      const name = (userFn) ? `${userFn.firstName || ''} ${userFn.lastName || ''}`.trim() : 'Apple User';

      user = await User.create({
        email: finalEmail,
        name: name || 'Apple User',
        appleId,
        role: userRole,
        isVerified: true,
        authProvider: 'apple'
      });
      isNewUser = true;
    } else {
      if (!user.appleId) {
        user.appleId = appleId;
        if (user.authProvider === 'phone') user.authProvider = 'apple';
      }
      const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
      if (targetRole && validRoles.includes(targetRole) && user.role !== targetRole) {
        user.role = targetRole;
      }
      if (user.isModified()) {
        await user.save();
      }
    }

    await this._handleDeactivation(user);

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }

    const token = await generateToken({ id: user._id, role: user.role, email: user.email });
    return { token, role: user.role, isNewUser, user, ...vendorData };
  }

  async logout(token) {
    return true;
  }

  async verify(token) {
    const decoded = await verifyToken(token);
    if (!decoded) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }

    return { user, ...vendorData };
  }

  async refresh(token) {
    const decoded = await verifyToken(token);
    const newToken = await generateToken({ id: decoded.id, role: decoded.role, email: decoded.email });
    return { token: newToken };
  }

  async switchRole(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);

    // Security: Admins cannot switch roles
    if (user.role === USER_ROLES.ADMIN) {
      throw new Error("Admins cannot switch roles.");
    }

    // Toggle logic
    const newRole = user.role === USER_ROLES.VENDOR ? USER_ROLES.TRAVELLER : USER_ROLES.VENDOR;
    user.role = newRole;
    await user.save();

    let vendorData = {};
    if (user.role === USER_ROLES.VENDOR) {
      vendorData = await this._getVendorStatus(user);
    }

    return {
      success: true,
      role: user.role,
      user: { ...user.toObject(), password: undefined },
      ...vendorData
    };
  }

  async becomeVendor(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    if (user.role === USER_ROLES.ADMIN) throw new Error("Admins cannot switch roles.");
    if (user.role === USER_ROLES.VENDOR) throw new Error("Access denied: You are already a vendor.");

    user.role = USER_ROLES.VENDOR;
    await user.save();

    const vendorData = await this._getVendorStatus(user);
    return { success: true, role: user.role, user: { ...user.toObject(), password: undefined }, ...vendorData };
  }

  async becomeTraveller(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    if (user.role === USER_ROLES.ADMIN) throw new Error("Admins cannot switch roles.");
    if (user.role === USER_ROLES.TRAVELLER) throw new Error("Access denied: You are already a traveller.");

    user.role = USER_ROLES.TRAVELLER;
    await user.save();

    return { success: true, role: user.role, user: { ...user.toObject(), password: undefined } };
  }

  async me(token) {
    const decoded = await verifyToken(token);
    if (!decoded) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    return user;
  }

  async getProfileById(userId) {
    const user = await User.findById(userId).select('-password');

    if (!user) {
      throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    }

    let vendorData = {};
    if (user.role === 'vendor') {
      vendorData = await this._getVendorStatus(user);
    }
    return { ...user.toObject(), ...vendorData };
  }

  async forgetPassword(email) {
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

  async changePassword(userId, newPassword) {
    return this.resetPassword(userId, newPassword);
  }

  async updateProfile(email, updates) {
    const user = await User.findOneAndUpdate({ email }, updates, { returnDocument: 'after' });
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    return user;
  }

  async updateProfileById(userId, updates) {
    const user = await User.findByIdAndUpdate(userId, updates, { returnDocument: 'after' });
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    return user;
  }

  async deleteProfile(email) {
    const user = await User.findOneAndDelete({ email });
    if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
    return true;
  }

  async logoutAll(email) {
    return true;
  }
}

const authService = new AuthService();
export default authService;
