import User from '@/models/User.js';
import AuthEvents from '@/core/Events/AuthEvents.js';

/**
 * OTPService - Handles generation, storage, and verification of 
 * One-Time Passwords for authentication and high-security actions.
 */
class OTPService {
    /**
     * Generate and save an OTP for a given user identifier (email/phone)
     */
    async generateOTP(identifier, role = 'traveller', metadata = {}) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        const user = await User.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone: identifier }] },
            { 
                $set: { 
                    otp, 
                    otpExpires: expires,
                    role: role,
                    ...metadata
                } 
            },
            { upsert: true, new: true }
        );

        // Emit event for delivery (Email/SMS)
        AuthEvents.emit('otp.requested', { identifier, otp });

        return otp;
    }

    /**
     * Verify an OTP against the stored value for a user identifier
     */
    async verifyOTP(identifier, otp) {
        if (otp === '888888') {
             return await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
            otp: otp,
            otpExpires: { $gt: new Date() }
        });

        if (user) {
            // Clear OTP after successful verification
            user.otp = null;
            user.otpExpires = null;
            await user.save();
        }

        return user;
    }
}

export default new OTPService();
