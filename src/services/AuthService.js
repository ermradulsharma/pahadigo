const User = require('../models/User');
const OTPService = require('./OTPService');
const { generateToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');

class AuthService {
    async verifyAndLogin({ identifier, otp, email, phone }) {
        const otpRecord = OTPService.verifyOTP(identifier, otp);
        if (!otpRecord) {
            throw new Error('Invalid or expired OTP');
        }

        const role = otpRecord.role;

        // Find User
        let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        let isNewUser = false;

        if (!user) {
            const validRoles = ['user', 'vendor'];
            const userRole = (role && validRoles.includes(role)) ? role : 'user';

            // Create User
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
            // Role upgrade check
            if (role === 'vendor' && user.role === 'user') {
                user.role = 'vendor';
                await user.save();
            }
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });

        // Check if vendor profile exists
        if (!isNewUser && user.role === 'vendor') {
            const Vendor = require('../models/Vendor');
            const vendorProfile = await Vendor.findOne({ user: user._id });
            if (!vendorProfile) isNewUser = true;
        }

        return { token, role: user.role, isNewUser, user };
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

        if (!isNewUser && user.role === 'vendor') {
            const Vendor = require('../models/Vendor');
            const vendorProfile = await Vendor.findOne({ user: user._id });
            if (!vendorProfile) isNewUser = true;
        }

        const token = generateToken({ id: user._id, role: user.role, email: user.email });
        return { token, isNewUser, user };
    }
}

module.exports = new AuthService();
