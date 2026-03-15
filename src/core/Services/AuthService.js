import User from '@/models/User.js';
import OTPService from '@/services/OTPService.js';
import { generateToken, verifyToken } from '@/helpers/jwt.js';
import { USER_ROLES, AUTH_PROVIDERS, USER_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;
import Vendor from '@/models/Vendor.js';
import jwt from 'jsonwebtoken';

class AuthService {
    async _getVendorStatus(user) {
        const businessProfile = await Vendor.findOne({ user: user._id });
        let status = "setBusinessProfile";
        let profile = null;
        if (businessProfile) {
            profile = businessProfile;
            const docs = businessProfile.documents;
            if (docs) {
                const hasAadhar = Array.isArray(docs.aadharCard) && docs.aadharCard.length > 0 && docs.aadharCard[0].url;
                const hasPan = docs.panCard && docs.panCard.url;
                if (hasAadhar && hasPan) {
                    status = "profileCompleted";
                }
            }
        }
        return { businessProfileStatus: status, businessProfile: profile };
    }

    async _handleDeactivation(user) {
        if (!user.deletedAt && ![USER_STATUS.INACTIVE, USER_STATUS.DELETED, USER_STATUS.SUSPENDED].includes(user.status)) return;

        // Check if self-deleted (deletedBy matches user ID)
        const isSelfDeleted = user.deletedBy && user.deletedBy.toString() === user._id.toString();

        if (isSelfDeleted) {
            // Reactivate Account
            user.deletedAt = null;
            user.deletedBy = null;
            user.deletedReason = null;
            user.status = USER_STATUS.ACTIVE;
            await user.save();
            return;
        }

        throw new Error(RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED);
    }

    async deleteProfileById(userId, reason = null) {
        const updates = {
            deletedAt: new Date(),
            deletedBy: userId,
            deletedReason: reason,
            status: USER_STATUS.DELETED
        };

        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return true;
    }

    async loginWithPassword({ email, password, rememberMe = false }) {
        const user = await User.findOne({ email }).select('+password');
        if (!user) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

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
        const token = generateToken({ id: user._id, role: user.role, email: user.email }, tokenExpiry);
        return {
            token,
            user: { ...user.toObject(), password: undefined },
            role: user.role,
            ...vendorData
        };
    }

    async verifyAndLogin({ identifier, otp, email, phone, targetRole }) {
        const otpRecord = await OTPService.verifyOTP(identifier, otp);
        if (!otpRecord) {
            throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_OTP);
        }

        const { termsAccepted } = otpRecord;
        let role = otpRecord.role;
        if (role === 'master') {
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            role = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
        }

        let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        let isNewUser = false;
        if (!user) {
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            const userRole = (role && validRoles.includes(role)) ? role : USER_ROLES.TRAVELLER;
            const payload = {
                role: userRole,
                isVerified: true,
                authProvider: email ? AUTH_PROVIDERS.LOCAL : AUTH_PROVIDERS.PHONE,
                termsAccepted: !!termsAccepted,
                termsAcceptedAt: termsAccepted ? new Date() : null
            };
            if (email) payload.email = email;
            if (phone) payload.phone = phone;
            user = await User.create(payload);
            isNewUser = true;
        } else {
            if (role === USER_ROLES.VENDOR && user.role === USER_ROLES.TRAVELLER) {
                user.role = 'vendor';
            }
            if (termsAccepted && !user.termsAccepted) {
                user.termsAccepted = true;
                user.termsAcceptedAt = new Date();
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
        const token = generateToken({ id: user._id, role: user.role, identifier: user.email || user.phone });
        return {
            token,
            role: user.role,
            isNewUser,
            user,
            ...vendorData
        };
    }

    async googleAuth(idToken, targetRole) {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
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
            const validRoles = ['user', 'vendor'];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';
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
                await user.save();
            }
        }

        await this._handleDeactivation(user);

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, role: user.role, isNewUser, user, ...vendorData };
    }

    async facebookAuth(accessToken, targetRole) {
        if (!accessToken) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

        const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }

        const { id: facebookId, name, email } = data;
        const userEmail = email || `fb_${facebookId}@example.com`;

        let user = await User.findOne({ $or: [{ facebookId }, { email: userEmail }] });
        let isNewUser = false;

        if (!user) {
            const validRoles = ['user', 'vendor'];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';
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
                await user.save();
            }
        }

        await this._handleDeactivation(user);

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
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
            const validRoles = ['user', 'vendor'];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';

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
                await user.save();
            }
        }

        await this._handleDeactivation(user);

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, role: user.role, isNewUser, user, ...vendorData };
    }

    async logout(token) {
        return true;
    }

    async verify(token) {
        const decoded = verifyToken(token);
        if (!decoded) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        return { user, ...vendorData };
    }

    async refresh(token) {
        const decoded = verifyToken(token);
        const newToken = generateToken({ id: decoded.id, role: decoded.role, email: decoded.email });
        return { token: newToken };
    }

    async me(token) {
        const decoded = verifyToken(token);
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

    async resetPassword(email, newPassword) {
        const user = await User.findOne({ email });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        user.password = newPassword;
        await user.save();
        return true;
    }

    async changePassword(email, newPassword) {
        return this.resetPassword(email, newPassword);
    }

    async updateProfile(email, updates) {
        const user = await User.findOneAndUpdate({ email }, updates, { new: true });
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        return user;
    }

    async updateProfileById(userId, updates) {
        const user = await User.findByIdAndUpdate(userId, updates, { new: true });
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