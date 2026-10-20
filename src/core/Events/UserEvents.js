import EventEmitter from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { NOTIFICATION } from '../Constants/notification';

const UserEvents = new EventEmitter();

const userEmailListener = (eventKey, handlerFn) => {
    UserEvents.on(eventKey, async ({ identifier, details, metadata = {} }) => {
        try {
            if (identifier && identifier.includes('@')) {
                await handlerFn(identifier, details, metadata);
            }
        } catch (error) {
            getLogger().error({ err: error }, `[UserEvents] Error handling ${eventKey}`);
        }
    });
};

userEmailListener(NOTIFICATION.KEY.USER.PROFILE.UPDATED, (id, data) => NotificationService.sendProfileUpdateEmail(id, data));

UserEvents.emitAsync = async function (event, data) {
    const listeners = this.listeners(event);
    if (!listeners || listeners.length === 0) return [];
    return await Promise.all(listeners.map(fn => fn(data)));
};
export default UserEvents;
