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
            user.preferences.tempRole = null;
            if (user.isModified()) await user.save();
        }

        await this._handleDeactivation(user);

        let vendorData = {};
        if (user.role === USER_ROLES.VENDOR) {
            vendorData = await this._getVendorStatus(user);
        }

        const tokens = await BaseAuthService.generateAndSaveTokens(user, true);
        return { tokens, role: user.role, isNewUser, user, ...vendorData };
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
        const tokens = await BaseAuthService.generateAndSaveTokens(user, true);
        return { tokens, role: user.role, isNewUser, user, ...vendorData };
    }

    async authenticateWithFacebook(accessToken, targetRole) {
        const config = await getAppConfig();
        const facebookAppId = config.facebook?.app_id;
        if (!facebookAppId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        if (!response.ok) {
            throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
        const payload = await response.json();
        if (payload.error) {
            throw new Error(payload.error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
        const { id: facebookId, name, email } = payload;
        if (!facebookId) {
            throw new Error(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }

        let user = null;
        if (email) {
            user = await User.findOne({ $or: [{ facebookId }, { email }] });
        } else {
            user = await User.findOne({ facebookId });
        }
        let isNewUser = DEFAULTS.FALSE;

        if (!user) {
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
            user = await User.create({
                email: email || null,
                name: name || null,
                facebookId,
                role: userRole,
                isVerified: DEFAULTS.TRUE,
                authProvider: AUTH_PROVIDERS.FACEBOOK
            });
            isNewUser = DEFAULTS.TRUE;
        } else {
            if (!user.facebookId) {
                user.facebookId = facebookId;
                user.authProvider = AUTH_PROVIDERS.FACEBOOK;
            }
            if (email && !user.email) {
                user.email = email;
            }
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            if (targetRole && validRoles.includes(targetRole)) user.role = targetRole;
            if (user.isModified()) await user.save();
        }

        await this._handleDeactivation(user);
        let vendorData = user.role === USER_ROLES.VENDOR ? await this._getVendorStatus(user) : {};
        const tokens = await BaseAuthService.generateAndSaveTokens(user, true);
        return { tokens, role: user.role, isNewUser, user, ...vendorData };
    }

    async authenticateWithApple(idToken, targetRole, appleUser, appleEmail) {
        const config = await getAppConfig();
        const appleClientId = config.apple?.client_id;
        if (!appleClientId) throw new Error(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);

        const decodedToken = jwt.decode(idToken, { complete: true });
        if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
            throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }

        const applePublicKey = await getApplePublicKey(decodedToken.header.kid);
        
        let payload;
        try {
            payload = jwt.verify(idToken, applePublicKey, {
                algorithms: ['RS256'],
                issuer: 'https://appleid.apple.com',
                audience: appleClientId
            });
        } catch (err) {
            throw new Error(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }

        const appleId = payload.sub;
        const email = payload.email || appleEmail || null;
        
        let name = null;
        if (appleUser && appleUser.name) {
            name = [appleUser.name.firstName, appleUser.name.lastName].filter(Boolean).join(' ');
        }
        if (!name) {
            name = email ? email.split('@')[0] : 'Apple User';
        }

        let user = null;
        if (email) {
            user = await User.findOne({ $or: [{ appleId }, { email }] });
        } else {
            user = await User.findOne({ appleId });
        }
        let isNewUser = DEFAULTS.FALSE;

        if (!user) {
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            const userRole = (targetRole && validRoles.includes(targetRole)) ? targetRole : USER_ROLES.TRAVELLER;
            user = await User.create({
                email: email || null,
                name: name || null,
                appleId,
                role: userRole,
                isVerified: DEFAULTS.TRUE,
                authProvider: AUTH_PROVIDERS.APPLE
            });
            isNewUser = DEFAULTS.TRUE;
        } else {
            if (!user.appleId) {
                user.appleId = appleId;
                user.authProvider = AUTH_PROVIDERS.APPLE;
            }
            if (email && !user.email) {
                user.email = email;
            }
            const validRoles = [USER_ROLES.TRAVELLER, USER_ROLES.VENDOR];
            if (targetRole && validRoles.includes(targetRole)) user.role = targetRole;
            if (user.isModified()) await user.save();
        }

        await this._handleDeactivation(user);
        let vendorData = user.role === USER_ROLES.VENDOR ? await this._getVendorStatus(user) : {};
        const tokens = await BaseAuthService.generateAndSaveTokens(user, true);
        return { tokens, role: user.role, isNewUser, user, ...vendorData };
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
        user.preferences.tempRole = user.preferences?.tempRole === USER_ROLES.VENDOR ? null : USER_ROLES.VENDOR;
        await user.save();
        const vendorData = await this._getVendorStatus(user);
        return true;
    }

    async downgradeToTraveller(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        if (user.role === USER_ROLES.ADMIN) throw new Error(RESPONSE_MESSAGES.AUTH.ADMIN_CANNOT_SWITCH);
        user.preferences.tempRole = user.preferences?.tempRole === USER_ROLES.TRAVELLER ? null : USER_ROLES.TRAVELLER;
        await user.save();
        return true;
    }
}

export default new AuthService();
