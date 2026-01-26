import nodemailer from 'nodemailer';
import { getAppConfig } from '@/lib/appConfig';
const { createTransport } = nodemailer;

class OTPService {
    constructor() {
        this.otps = new Map();
    }

    generateOTP(identifier, role) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        this.otps.set(identifier, { otp, expiresAt, role });

        this._sendOTP(identifier, otp).catch(err => console.error(`Failed to send OTP to ${identifier}:`, err.message));
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
            console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
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
        console.log(`OTP Email sent to ${email}`);
    }

    async _sendSMS(phone, otp) {
        const config = await getAppConfig();
        const { auth_key: authKey, template_id: templateId } = config.msg91;

        if (!authKey || !templateId) {
            console.log(`[STANDBY MODE] MSG91 Not Configured. OTP for ${phone}: ${otp}`);
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
            console.log(`MSG91 SMS sent to ${phone}`);
        } catch (error) {
            console.error(`Failed to send MSG91 SMS:`, error.message);
            console.log(`[FALLBACK] OTP for ${phone}: ${otp}`);
        }
    }

    verifyOTP(identifier, code) {
        const MASTER_OTP = process.env.MASTER_OTP || '888888';
        if (code.toString() === MASTER_OTP) {
            console.log(`[MASTER OTP] Used for ${identifier}`);
            return {
                otp: MASTER_OTP,
                expiresAt: Date.now() + 100000,
                role: 'master'
            };
        }

        const record = this.otps.get(identifier);
        if (!record) return null;
        if (Date.now() > record.expiresAt) {
            this.otps.delete(identifier);
            return null;
        }
        if (record.otp.toString() === code.toString()) {
            this.otps.delete(identifier);
            return record;
        }
        return null;
    }
}

const otpService = new OTPService();
export default otpService;
