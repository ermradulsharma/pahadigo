import User from '@/models/User.js';
import { getAppConfig } from '@/lib/appConfig';
import crypto from 'crypto';
import AuthEvents from '../Events/AuthEvents.js';

class OTPService {

    async generateOTP(identifier, role, extraData = {}) {
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        const isEmail = identifier.includes('@');
        const query = isEmail ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };
        await User.findOneAndUpdate(
            query,
            { otp, otpExpires: expiresAt, $set: { 'preferences.tempRole': role, 'preferences.tempExtraData': extraData } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
        try {
            AuthEvents.emit('otp.requested', { identifier, otp });
        } catch (error) {
            console.error("[OTPService] Failed to emit otp.requested event:", error);
        }
        return otp;
    }

    async verifyOTP(identifier, code) {
        const config = await getAppConfig();
        const MASTER_OTP = config.secrets.master_otp;
        if (MASTER_OTP && code.toString() === MASTER_OTP) {
            return { otp: MASTER_OTP, expiresAt: Date.now() + 86400000, role: 'master' };
        }
        const query = identifier.includes('@') ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };
        const user = await User.findOne(query).select('+otp +otpExpires');

        if (!user || !user.otp) return null;

        if (new Date() > user.otpExpires) {
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return null;
        }

        if (user.otp.toString() === code.toString()) {
            const role = user.preferences?.tempRole;
            const extraData = user.preferences?.tempExtraData || {};

            await User.updateOne({ _id: user._id }, {
                $unset: {
                    otp: 1,
                    otpExpires: 1,
                    'preferences.tempRole': 1,
                    'preferences.tempExtraData': 1
                }
            });
            return { otp: code, role, ...extraData };
        }
        return null;
    }
}

const otpService = new OTPService();
export default otpService;
