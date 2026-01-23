const User = require('../models/User');
const OTPService = require('./OTPService');
const { generateToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');
const Vendor = require('../models/Vendor');

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

    async verifyAndLogin({ identifier, otp, email, phone }) {
        const otpRecord = OTPService.verifyOTP(identifier, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }
        const role = otpRecord.role;
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
        if (!accessToken) throw new Error('Facebook Token required');
        const email = `fb_user_${Date.now()}@example.com`;
        const name = "Facebook User";
        const fbId = `fb_${Date.now()}`;

        let user = await User.findOne({ email });
        let isNewUser = false;

        if (!user) {
            const validRoles = ['user', 'vendor'];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : 'user';
            user = await User.create({
                email,
                name,
                facebookId: fbId,
                role: userRole,
                isVerified: true,
                authProvider: 'facebook'
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

    async logout(token) {
        return true;
    }

    async verify(token) {
        const { verifyToken } = require('../helpers/jwt');
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
        const { verifyToken, generateToken } = require('../helpers/jwt');
        const decoded = verifyToken(token);
        const newToken = generateToken({ id: decoded.id, role: decoded.role, email: decoded.email });
        return { token: newToken };
    }

    async me(token) {
        const { verifyToken } = require('../helpers/jwt');
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
        // Invalidating all tokens would require a 'tokenVersion' in User model 
        // to be incremented and checked in JWT payload.
        // Valid placeholder:
        return true;
    }
}

module.exports = new AuthService();
