import { USER_ROLES, AUTH_PROVIDERS, STATUS, RESPONSE_MESSAGES, VENDOR_STATUS, DEFAULTS } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import OTPService from '@/core/Services/Auth/User/OTPService.js';
import BaseAuthService from '@/core/Services/Auth/BaseAuthService.js';
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;
import { getAppConfig } from '@/core/Lib/appConfig.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { getBusinessBy, businessAuthResponse, userAuthResponse } from "@/core/Helpers/index.js";

async function getApplePublicKey(kid) {
    try {
        const response = await fetch('https://appleid.apple.com/auth/keys');
        if (!response.ok) {
            throw new Error('Failed to fetch Apple public keys');
        }
        const { keys } = await response.json();
        const key = keys.find(k => k.kid === kid);
        if (!key) {
            throw new Error('Matching Apple public key not found');
        }
        return crypto.createPublicKey({ format: 'jwk', key });
    } catch (err) {
        throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    }
}

class AuthService {

    async initiateOTP({ identifier, role, termsAccepted }) {
        const existingUser = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        if (existingUser && existingUser.role === USER_ROLES.ADMIN) throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        if (existingUser && termsAccepted) {
            existingUser.termsAccepted = DEFAULTS.TRUE;
            existingUser.termsAcceptedAt = new Date();
            await existingUser.save();
        }
        return await OTPService.generateOTP(identifier, role, { termsAccepted });
    }

    async authenticateWithOTP({ identifier, otp, targetRole }) {
        const record = await OTPService.verifyOTP(identifier, otp);
        if (!record) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_OTP);

        const { termsAccepted } = record;
        const isTermsAccepted = termsAccepted === DEFAULTS.TRUE || termsAccepted === 'true';
        const isEmail = identifier.includes('@');
        const normalizedEmail = isEmail ? identifier.toLowerCase().trim() : null;
        const normalizedPhone = !isEmail ? identifier.trim() : null;

        let userRole = record.role;
        if (userRole === 'master') userRole = this._resolveRole(targetRole);

        let user = await User.findOne({ $or: [{ email: normalizedEmail || identifier }, { phone: normalizedPhone || identifier }] });

        // Security Validation: Admins cannot use OTP Login
        if (user && user.role === USER_ROLES.ADMIN) throw new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);

        let isNewUser = (!user || !user.isVerified);
        if (!user) {
            const payload = {
                role: this._resolveRole(userRole),
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
            if (userRole && [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR].includes(userRole) && user.role !== userRole) user.role = userRole;
            if (isTermsAccepted && !user.termsAccepted) {
                user.termsAccepted = DEFAULTS.TRUE;
                user.termsAcceptedAt = new Date();
            }
            user.preferences.tempRole = null;
            if (user.isModified()) await user.save();
        }
        return await this._finalizeAuthResponse(user, isNewUser);
    }

    async authenticateWithGoogle(idToken, targetRole) {
        const config = await getAppConfig();
        const googleClientId = config.google?.client_id;
        if (!googleClientId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        const { user, isNewUser } = await this._findOrCreateSocialUser({ email, name, providerKey: 'googleId', providerId: googleId, authProvider: AUTH_PROVIDERS.GOOGLE, targetRole });
        return await this._finalizeAuthResponse(user, isNewUser);
    }

    async authenticateWithFacebook(accessToken, targetRole) {
        const config = await getAppConfig();
        const facebookAppId = config.facebook?.app_id;
        if (!facebookAppId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        if (!response.ok) throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

        const payload = await response.json();
        if (payload.error || !payload.id) throw new Error(payload.error?.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

        const { id: facebookId, name, email } = payload;

        const { user, isNewUser } = await this._findOrCreateSocialUser({ email, name, providerKey: 'facebookId', providerId: facebookId, authProvider: AUTH_PROVIDERS.FACEBOOK, targetRole });
        return await this._finalizeAuthResponse(user, isNewUser);
    }

    async authenticateWithApple(idToken, targetRole, appleUser, appleEmail) {
        const config = await getAppConfig();
        const appleClientId = config.apple?.client_id;
        if (!appleClientId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

        const decodedToken = jwt.decode(idToken, { complete: true });
        if (!decodedToken?.header?.kid) throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);

        const applePublicKey = await getApplePublicKey(decodedToken.header.kid);
        let payload;
        try {
            payload = jwt.verify(idToken, applePublicKey, { algorithms: ['RS256'], issuer: 'https://appleid.apple.com', audience: appleClientId });
        } catch (err) {
            throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }

        const appleId = payload.sub;
        const email = payload.email || appleEmail || null;
        let name = appleUser?.name ? [appleUser.name.firstName, appleUser.name.lastName].filter(Boolean).join(' ') : (email ? email.split('@')[0] : 'Apple User');

        const { user, isNewUser } = await this._findOrCreateSocialUser({ email, name, providerKey: 'appleId', providerId: appleId, authProvider: AUTH_PROVIDERS.APPLE, targetRole });

        return await this._finalizeAuthResponse(user, isNewUser);
    }

    // Helper methods
    _resolveRole(role) {
        const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
        return (role && validRoles.includes(role)) ? role : USER_ROLES.TRAVELLER;
    }

    async _finalizeAuthResponse(user, isNewUser) {
        await this._handleDeactivation(user);
        const tokens = await BaseAuthService.generateAndSaveTokens(user, true);
        const userFormat = userAuthResponse(user);
        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) vendorData = await this._getVendorStatus(user);
        return { ...userFormat, tokens, isNewUser, ...vendorData };
    }

    async _findOrCreateSocialUser({ email, name, providerKey, providerId, authProvider, targetRole }) {
        let user = null;
        if (email) {
            user = await User.findOne({ $or: [{ [providerKey]: providerId }, { email }] });
        } else {
            user = await User.findOne({ [providerKey]: providerId });
        }

        let isNewUser = DEFAULTS.FALSE;
        const userRole = this._resolveRole(targetRole);

        if (!user) {
            user = await User.create({ email: email || null, name: name || null, [providerKey]: providerId, role: userRole, isVerified: DEFAULTS.TRUE, authProvider });
            isNewUser = DEFAULTS.TRUE;
        } else {
            if (!user[providerKey]) {
                user[providerKey] = providerId;
                user.authProvider = authProvider;
            }
            if (email && !user.email) user.email = email;
            if (targetRole && [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR].includes(targetRole)) user.role = targetRole;
            if (user.isModified()) await user.save();
        }
        return { user, isNewUser };
    }

    async _getVendorStatus(user) {
        const business = await getBusinessBy({ user: user._id });
        const businessData = businessAuthResponse(business);
        const businessProfileStatus = businessData.profileStatus
        return { businessProfileStatus, ...{ businessProfile: businessData } };
    }

    async _handleDeactivation(user) {
        if (user.status === STATUS.INACTIVE) {
            user.status = STATUS.ACTIVE;
            await user.save();
        }
    }
}

export default new AuthService();
