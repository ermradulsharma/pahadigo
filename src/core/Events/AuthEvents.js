import { EventEmitter } from 'events';
import NotificationService from '../Services/NotificationService.js';

const AuthEvents = new EventEmitter();

/**
 * Event: otp.requested
 * Handles asynchronous delivery of OTP via Email or SMS.
 */
AuthEvents.on('otp.requested', async ({ identifier, otp }) => {
    try {
        const isEmail = identifier.includes('@');
        if (isEmail) {
            await NotificationService.sendOTPEmail(identifier, otp);
        } else {
            await NotificationService.sendSMS(identifier, `Your PahadiGo verification code is: ${otp}. Valid for 5 minutes.`);
        }
    } catch (error) {
        console.error("[AuthEvents] Error handling otp.requested:", error);
    }
});

/**
 * Event: auth.login_success
 * Sends a security alert email or SMS when a user logs in successfully.
 */
AuthEvents.on('auth.login_success', async ({ user, metadata }) => {
    try {
        const { identifier } = metadata;
        const isEmail = identifier?.includes('@');

        if (isEmail && user.email) {
            await NotificationService.sendLoginAlertEmail(user.email, {
                device: metadata.device,
                ip: metadata.ip,
                time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            });
        } else if (!isEmail && user.phone) {
            await NotificationService.sendLoginAlertSMS(user.phone, {
                device: metadata.device,
                ip: metadata.ip
            });
        }
    } catch (error) {
        console.error("[AuthEvents] Error handling auth.login_success:", error);
    }
});

export default AuthEvents;
