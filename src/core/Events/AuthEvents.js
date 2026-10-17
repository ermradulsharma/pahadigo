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
            const success = await NotificationService.sendOTPEmail(identifier, otp);
            if (!success) {
                getLogger().warn({ identifier }, "[AuthEvents] OTP email sending failed");
            }
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
        // console.log("Login User", user);
        // console.log("Metadata", metadata);
        const { identifier, realIp, ip, rawDevice = {}, location, appInfo = {}, cdn = {}, isNewDevice, isNewLocation, sessionId } = metadata;
        const isEmail = identifier?.includes('@');

        console.log("Identifier", identifier);
        console.log("Real IP", realIp);
        console.log("IP", ip);
        console.log("Raw Device", rawDevice);
        console.log("Location", location);
        console.log("App Info", appInfo);
        console.log("CDN", cdn);
        console.log("Is New Device", isNewDevice);
        console.log("Is New Location", isNewLocation);
        console.log("Session ID", sessionId);
        console.log("Is Email", isEmail);

        const loginDetails = {
            name: user?.name,
            accountIdentifier: user?.email || user?.phone || identifier,
            authMethod: metadata.authMethod,
            role: metadata.role || user?.role,

            // raw device data
            os: rawDevice.os,
            browser: rawDevice.browser,
            deviceType: rawDevice.deviceType,
            deviceName: rawDevice.deviceName,
            summary: rawDevice.summary,

            // raw app info
            platform: appInfo.platform,
            appVersion: appInfo.appVersion,
            carrier: appInfo.carrier,

            // cdn
            datacenter: cdn.datacenter,

            // raw ip and location
            ip: ip,
            location: location,

            // login at and time
            loginAt: new Date().toISOString(),
            loginTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),

            // flags
            isNewDevice: Boolean(isNewDevice),
            isNewLocation: Boolean(isNewLocation),
            sessionId: sessionId || null
        };

        console.log("Login Details", loginDetails);

        if (isEmail && user?.email) {
            await NotificationService.sendLoginAlertEmail(user.email, loginDetails);
        } else if (!isEmail && user?.phone) {
            await NotificationService.sendLoginAlertSMS(user.phone, loginDetails);
        }
    } catch (error) {
        getLogger().error({ err: error }, "[AuthEvents] Error handling auth.login_success");
    }
});

/**
 * Asynchronously emit an event and wait for all registered listeners to complete.
 * Crucial for serverless environments (e.g. Vercel) where background promises are
 * frozen as soon as the HTTP response is dispatched.
 */
AuthEvents.emitAsync = async function (event, data) {
    const listeners = this.listeners(event);
    if (!listeners || listeners.length === 0) return [];
    return await Promise.all(listeners.map(fn => fn(data)));
};

export default AuthEvents;
