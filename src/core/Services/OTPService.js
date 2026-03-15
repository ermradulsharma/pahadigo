import User from '@/models/User.js';
import nodemailer from 'nodemailer';
import { getAppConfig } from '@/lib/appConfig';
import crypto from 'crypto';
const { createTransport } = nodemailer;

class OTPService {
    // constructor() {
    //     this.otps = new Map();
    // }

    async generateOTP(identifier, role, extraData = {}) {
        // Use cryptographically secure random number
        const otp = crypto.randomInt(100000, 1000000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const query = identifier.includes('@') ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };
        
        // Persist OTP in User model (upsert if not exists)
        await User.findOneAndUpdate(
            query,
            { 
                otp, 
                otpExpires: expiresAt,
                // We store the requested role and extraData (like terms) temporarily
                // so it can be used during verification.
                $set: { 
                    'preferences.tempRole': role,
                    'preferences.tempExtraData': extraData
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        this._sendOTP(identifier, otp).catch(err => { });
        return otp;
    }

    async _sendOTP(identifier, otp) {
        if (identifier.includes('@')) {
            await this._sendEmail(identifier, otp);
        } else {
            await this._sendSMS(identifier, otp);
        }
    }

    async _sendEmail(email, otp) {
        const config = await getAppConfig();
        const { user, pass, host, port, from_address } = config.smtp;

        if (!user || !pass) {
            return;
        }

        const transporter = createTransport({
            host: host,
            port: port,
            secure: false,
            auth: {
                user: user,
                pass: pass,
            },
        });

        await transporter.sendMail({
            from: `"Travels App" <${from_address || user}>`,
            to: email,
            subject: "Your Login OTP",
            text: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
            html: `<b>Your OTP for login is: ${otp}</b><br>It is valid for 5 minutes.`
        });
    }

    async _sendSMS(phone, otp) {
        const config = await getAppConfig();
        const { auth_key: authKey, template_id: templateId } = config.msg91;

        if (!authKey || !templateId) {
            return;
        }
        try {
            const msg91Module = await import('msg91-api');
            const msg91Func = msg91Module.default || msg91Module;
            const msg91 = msg91Func(authKey);

            const args = {
                "flow_id": templateId,
                "sender": "PAHADI",
                "mobiles": phone,
                "var": otp
            };

            await new Promise((resolve, reject) => {
                msg91.send(args, (err, response) => {
                    if (err) return reject(err);
                    resolve(response);
                });
            });
        } catch (error) {
        }
    }

    async verifyOTP(identifier, code) {
        // [AUDIT] Removed MASTER_OTP backdoor for security.
        // [APP STORE REVIEW] Restored static MASTER_OTP for review compliance.
        // This allows reviewers to bypass real OTP verification.
        const MASTER_OTP = process.env.MASTER_OTP;
        if (MASTER_OTP && code.toString() === MASTER_OTP) {
            return {
                otp: MASTER_OTP,
                expiresAt: Date.now() + 86400000, // Long expiry for review session
                role: 'master'
            };
        }

        const query = identifier.includes('@') ? { email: identifier.toLowerCase().trim() } : { phone: identifier.trim() };
        const user = await User.findOne(query);

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
            
            // Clear OTP after successful verification
            user.otp = undefined;
            user.otpExpires = undefined;
            if (user.preferences) {
                user.preferences.tempRole = undefined;
                user.preferences.tempExtraData = undefined;
            }
            await user.save();

            return { otp: code, role, ...extraData };
        }
        return null;
    }
}

const otpService = new OTPService();
export default otpService;
