const nodemailer = require('nodemailer');
// const twilio = require('twilio'); // Removed in favor of MSG91

class OTPService {
    constructor() {
        this.otps = new Map();
    }

    generateOTP(identifier, role) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000;
        this.otps.set(identifier, { otp, expiresAt, role });

        // Asynchronously send OTP
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
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
            return;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"Travels App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your Login OTP",
            text: `Your OTP for login is: ${otp}. It is valid for 5 minutes.`,
            html: `<b>Your OTP for login is: ${otp}</b><br>It is valid for 5 minutes.`
        });
        console.log(`OTP Email sent to ${email}`);
    }

    async _sendSMS(phone, otp) {
        // 1. Check for MSG91 Creds
        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;

        // 2. Standby Mode (Fallback)
        if (!authKey || !templateId) {
            console.log(`[STANDBY MODE] MSG91 Not Configured. OTP for ${phone}: ${otp}`);
            return;
        }

        // 3. MSG91 Integration
        try {
            const msg91 = require('msg91-api')(authKey);
            const args = {
                "flow_id": templateId,
                "sender": "PAHADI", // Will fallback to default if DLT not approved
                "mobiles": phone,
                "var": otp // Assuming template has ##var## variable
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
            // Fallback log ensures dev doesn't get stuck even if API fails
            console.log(`[FALLBACK] OTP for ${phone}: ${otp}`);
        }
    }

    verifyOTP(identifier, code) {
        // --- MASTER OTP CHECK ---
        const MASTER_OTP = process.env.MASTER_OTP || '888888';
        if (code.toString() === MASTER_OTP) {
            console.log(`[MASTER OTP] Used for ${identifier}`);
            // Return a mock record so the flow continues smoothly
            return {
                otp: MASTER_OTP,
                expiresAt: Date.now() + 100000,
                role: 'master' // Let AuthService decide the final role
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

module.exports = new OTPService();
