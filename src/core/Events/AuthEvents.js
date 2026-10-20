import { EventEmitter } from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { NOTIFICATION } from '../Constants/notification';

const AuthEvents = new EventEmitter();

/**
 * Handle OTP requested event
 * Sends OTP via Email or SMS based on identifier type
 */
const authEmailListener = (eventKey, handlerFn) => {
    AuthEvents.on(eventKey, async ({ identifier, details, metadata = {} }) => {
        try {
            if (identifier && identifier.includes('@')) {
                await handlerFn(identifier, details, metadata);
            }
        } catch (error) {
            getLogger().error({ err: error }, `[AuthEvents] Error handling ${eventKey}`);
        }
    });
};

authEmailListener(NOTIFICATION.KEY.USER.OTP, (id, data) => NotificationService.sendSecureCodeEmail(id, data));
authEmailListener(NOTIFICATION.KEY.USER.WELCOME, (id, data) => NotificationService.sendWelcomeEmail(id, data));
authEmailListener(NOTIFICATION.KEY.USER.ALERT, (id, data, metadata = {}) => NotificationService.sendAlertEmail(id, data, metadata));

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
