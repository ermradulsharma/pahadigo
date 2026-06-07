import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';

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
        const loginDetails = {
            device: metadata?.device || 'Unknown Device',
            browser: metadata?.browser || 'Unknown Browser',
            os: metadata?.os || 'Unknown OS',
            userAgent: metadata?.userAgent || 'Unknown',
            loginAt: new Date().toISOString(),
            loginTime: new Date().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata'
            }),
            ip: metadata?.ip || 'Unknown IP',
            location: metadata?.location || {
                city: 'Unknown',
                state: 'Unknown',
                country: 'Unknown'
            },
            isNewDevice: metadata?.isNewDevice || false,
            isNewLocation: metadata?.isNewLocation || false
        };

        if (isEmail && user.email) {
            await NotificationService.sendLoginAlertEmail(user.email, loginDetails);
        } else if (!isEmail && user.phone) {
            await NotificationService.sendLoginAlertSMS(user.phone, loginDetails);
        }
    } catch (error) {
        console.error("[AuthEvents] Error handling auth.login_success:", error);
    }
});

export default AuthEvents;
