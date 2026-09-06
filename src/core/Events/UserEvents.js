import EventEmitter from 'events';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';

const UserEvents = new EventEmitter();

/**
 * Event: user.profile_updated
 * Sends an email to the user alerting them of a profile update.
 */
UserEvents.on('user.profile_updated', async ({ identifier, userName }) => {
    try {
        if (identifier && identifier.includes('@'))
            await NotificationService.sendUserProfileUpdatedEmail(identifier, userName);
    } catch (error) {
        getLogger().error({ err: error }, "[UserEvents] Error handling user.profile_updated");
    }
});

export default UserEvents;
