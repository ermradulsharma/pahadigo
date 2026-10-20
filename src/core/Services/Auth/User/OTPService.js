import { randomInt } from 'node:crypto';
import { DEFAULTS, USER_ROLES } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import AuthEvents from '@/core/Events/AuthEvents.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { NOTIFICATION } from '@/core/Constants/notification';
import { use } from 'react';

/**
 * OTPService - Handles generation, storage, and verification of
 * One-Time Passwords for authentication and high-security actions.
 */
class OTPService {

    /**
     * Check if an identifier belongs to allowed reviewer/test accounts
     */
    async _isTestAccount(identifier) {
        if (!identifier) return false;
        const config = await getAppConfig();
        const testIdentifiersConfig = config.secrets?.test_identifiers;
        const allowedTestAccounts = new Set([
            'reviewer@pahadigo.co.in',
            'apple@pahadigo.co.in',
            'google@pahadigo.co.in',
            'test@pahadigo.co.in',
            '+919999999999',
            '+918888888888',
            '9999999999',
            '8888888888',
            ...(testIdentifiersConfig ? testIdentifiersConfig.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [])
        ]);
        const normalizedIdentifier = identifier.toLowerCase().trim();
        return allowedTestAccounts.has(normalizedIdentifier) || normalizedIdentifier.endsWith('@pahadigo.test');
    }

    /**
     * Generate and save an OTP for a given user identifier (email/phone)
     */
    async generateOTP(identifier, role, metadata = {}) {
        const isTest = await this._isTestAccount(identifier);
        let otp;
        if (isTest) {
            const config = await getAppConfig();
            const masterOTP = config.secrets?.master_otp;
            otp = masterOTP;
        } else {
            otp = randomInt(100000, 1000000).toString();
        }
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        const isEmail = identifier.includes('@');
        const updatePayload = { otp, otpExpires: expires, ...metadata };
        isEmail ? updatePayload.email = identifier.toLowerCase().trim() : updatePayload.phone = identifier.trim();
        const user = await User.findOneAndUpdate({ $or: [{ email: identifier }, { phone: identifier }] }, { $set: updatePayload, $setOnInsert: { role: role } }, { upsert: true, returnDocument: 'after' });
        if (!isTest) await AuthEvents.emitAsync(NOTIFICATION.KEY.USER.OTP, { identifier: user.email, details: otp });
        return otp;
    }

    /**
     * Verify an OTP against the stored value for a user identifier.
     * Master OTP is restricted strictly to designated reviewer/test accounts.
     */
    async verifyOTP(identifier, otp, role) {
        const config = await getAppConfig();
        const masterOTP = config.secrets?.master_otp;
        const isAllowedTestAccount = await this._isTestAccount(identifier);

        const query = { $or: [{ email: identifier }, { phone: identifier }], role: role };
        if (masterOTP && otp === masterOTP && isAllowedTestAccount) {
            let user = await User.findOne(query);
            if (user) return user;
        }
        const user = await User.findOne({ ...query, otp: otp, otpExpires: { $gt: new Date() } });
        if (user) {
            user.otp = DEFAULTS.NULL;
            user.otpExpires = DEFAULTS.NULL;
            await user.save();
        }
        return user;
    }
}

export default new OTPService();
