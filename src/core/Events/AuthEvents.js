import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';

const AuthEvents = new EventEmitter();

/**
 * Handle OTP requested event
 * Sends OTP via Email or SMS based on identifier type
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
        getLogger().error({ err: error }, "[AuthEvents] Error handling otp.requested");
    }
});

/**
 * Handle successful signup event
 * Sends welcome email to new user
 */
AuthEvents.on('auth.welcome', async ({ identifier, user }) => {
    try {
        const isEmail = identifier.includes('@');
        if (isEmail) {
            await NotificationService.sendWelcomeEmail(identifier, user);
        }
    } catch (error) {
        getLogger().error({ err: error }, "[AuthEvents] Error handling auth.welcome");
    }
});

/**
 * Handle successful login event
 * Emits login security alerts via Email or SMS with rich device & geo metadata.
 */
AuthEvents.on('auth.login_success', async ({ user, metadata = {} }) => {
    try {
        const { identifier, realIp, ip, rawDevice = {}, location, appInfo = {}, cdn = {}, isNewDevice, isNewLocation, sessionId } = metadata;
        const isEmail = identifier?.includes('@');

        const loginDetails = {
            name: user?.name,
            accountIdentifier: user?.email || user?.phone || identifier,
            authMethod: metadata.authMethod,
            role: metadata.role || user?.role,
            device: rawDevice.deviceName,
            browser: rawDevice.browser,
            os: rawDevice.os,
            deviceType: rawDevice.deviceType,
            summary: rawDevice.summary,
            carrier: appInfo.carrier,
            appVersion: appInfo.appVersion ? `${appInfo.appVersion} (${appInfo.platform})` : null,
            datacenter: cdn.datacenter !== 'LOCAL' ? cdn.datacenter : null,
            loginAt: new Date().toISOString(),
            loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            ip: realIp || ip,
            location: typeof location === 'string' ? location : location?.summary,
            isNewDevice,
            isNewLocation,
            sessionId
        };

        if (isEmail && user?.email) {
            await NotificationService.sendLoginAlertEmail(user.email, loginDetails);
        } else if (!isEmail && user?.phone) {
            await NotificationService.sendLoginAlertSMS(user.phone, loginDetails);
        }
    } catch (error) {
        getLogger().error({ err: error }, "[AuthEvents] Error handling auth.login_success");
    }
});

export default AuthEvents;
