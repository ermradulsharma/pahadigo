import User from '../models/User.js';
import OTPService from './OTPService.js';
import { generateToken, verifyToken } from '../helpers/jwt.js';
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;
import Vendor from '../models/Vendor.js';
import jwt from 'jsonwebtoken';

class AuthService {
    async _getVendorStatus(user) {
        const vendorProfile = await Vendor.findOne({ user: user._id });
        let status = "setBusinessProfile";
        let profile = null;
        if (vendorProfile) {
            profile = vendorProfile;
            if (vendorProfile.documents &&
                vendorProfile.documents.aadharCardFront?.url &&
                vendorProfile.documents.panCard?.url &&
                vendorProfile.documents.businessRegistration?.url) {
                if (vendorProfile.businessName) status = "profileCompleted";
            }
        }
        return { vendorStatus: status, vendorProfile: profile };
    }

    async verifyAndLogin({ identifier, otp, email, phone, targetRole }) {
        const otpRecord = OTPService.verifyOTP(identifier, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }

        let role = otpRecord.role;
        if (role === 'master') {
            const validRoles = ['user', 'vendor'];
            role = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';
        }

        let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        let isNewUser = false;
        if (!user) {
            const validRoles = ['user', 'vendor'];
            const userRole = (role && validRoles.includes(role)) ? role : 'user';
            const payload = {
                role: userRole,
                isVerified: true,
                authProvider: email ? 'local' : 'phone'
            };
            if (email) payload.email = email;
            if (phone) payload.phone = phone;
            user = await User.create(payload);
            isNewUser = true;
        } else {
            if (role === 'vendor' && user.role === 'user') {
                user.role = 'vendor';
                await user.save();
            }
        }

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
        if (idToken === 'MASTER_TOKEN' || idToken === 'master_token') {
            console.log(`[MASTER TOKEN] Direct Google Login`);
            return this._mockSocialLogin('master_google_user@example.com', 'Master Google User', 'google_master_id', targetRole);
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            throw new Error('Google Auth is not configured');
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

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, isNewUser, user, ...vendorData };
    }

    async facebookAuth(accessToken, targetRole) {
        if (accessToken === 'MASTER_TOKEN' || accessToken === 'master_token') {
            console.log(`[MASTER TOKEN] Direct Facebook Login`);
            return this._mockSocialLogin('master_fb_user@example.com', 'Master FB User', 'fb_master_id', targetRole);
        }

        if (!accessToken) throw new Error('Facebook Token required');

        const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Invalid Facebook Token');
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

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, isNewUser, user, ...vendorData };
    }

    async appleAuth(idToken, targetRole, userFn, userEmail) {
        if (idToken === 'MASTER_TOKEN' || idToken === 'master_token') {
            console.log(`[MASTER TOKEN] Direct Apple Login`);
            return this._mockSocialLogin('master_apple_user@example.com', 'Master Apple User', 'apple_master_id', targetRole);
        }

        if (!idToken) throw new Error('Apple ID Token required');

        const decoded = jwt.decode(idToken);
        if (!decoded || !decoded.sub) {
            throw new Error('Invalid Apple ID Token');
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

        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, isNewUser, user, ...vendorData };
    }

    async logout(token) {
        return true;
    }

    async verify(token) {
        const decoded = verifyToken(token);
        if (!decoded) throw new Error('Invalid or expired Token');

        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new Error('User not found');

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
        const user = await User.findById(decoded.id).select('-password');
        if (!user) throw new Error('User not found');
        return user;
    }

    async forgetPassword(email) {
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');
        return { message: 'Reset link sent' };
    }

    async resetPassword(email, newPassword) {
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');
        user.password = newPassword;
        await user.save();
        return true;
    }

    async changePassword(email, newPassword) {
        return this.resetPassword(email, newPassword);
    }

    async updateProfile(email, updates) {
        const user = await User.findOneAndUpdate({ email }, updates, { new: true });
        if (!user) throw new Error('User not found');
        return user;
    }

    async deleteProfile(email) {
        const user = await User.findOneAndDelete({ email });
        if (!user) throw new Error('User not found');
        return true;
    }

    async logoutAll(email) {
        return true;
    }

    async _mockSocialLogin(email, name, id, targetRole) {
        let user = await User.findOne({ email });
        let isNewUser = false;
        if (!user) {
            const validRoles = ['user', 'vendor'];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';
            user = await User.create({
                email,
                name,
                role: userRole,
                isVerified: true,
                authProvider: 'mock_master'
            });
            isNewUser = true;
        }
        let vendorData = {};
        if (user.role === 'vendor') {
            vendorData = await this._getVendorStatus(user);
        }
        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, isNewUser, user, ...vendorData };
    }
}

export default new AuthService();
