import { randomInt } from 'node:crypto';
import { DEFAULTS, USER_ROLES } from '@/core/Constants/index.js';
import User from '@/core/Models/User.js';
import AuthEvents from '@/core/Events/AuthEvents.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

/**
 * OTPService - Handles generation, storage, and verification of
 * One-Time Passwords for authentication and high-security actions.
 */
class OTPService {
    /**
     * Generate and save an OTP for a given user identifier (email/phone)
     */
    async generateOTP(identifier, role = USER_ROLES.TRAVELLER, metadata = {}) {
        const otp = randomInt(100000, 1000000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
        const isEmail = identifier.includes('@');
        const updatePayload = { otp, otpExpires: expires, role: role, ...metadata };
        isEmail ? updatePayload.email = identifier.toLowerCase().trim() : updatePayload.phone = identifier.trim();
        const user = await User.findOneAndUpdate({ $or: [{ email: identifier }, { phone: identifier }] }, { $set: updatePayload }, { upsert: true, returnDocument: 'after' });
        AuthEvents.emit('otp.requested', { identifier, otp });
        return otp;
    }

    /**
     * Verify an OTP against the stored value for a user identifier
     */
    async verifyOTP(identifier, otp) {
        const config = await getAppConfig();
        const masterOtp = config.secrets?.master_otp;
        if (masterOtp && otp === masterOtp) {
            let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
            if (user) {
                user.termsAccepted = true;
                await user.save();
                return user;
            }
        }
        const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }], otp: otp, otpExpires: { $gt: new Date() } });
        if (user) {
            user.otp = DEFAULTS.NULL;
            user.otpExpires = DEFAULTS.NULL;
            await user.save();
        }
        return user;
    }
}

export default new OTPService();
