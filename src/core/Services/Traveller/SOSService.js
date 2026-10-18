import User from '@/core/Models/User.js';
import EmergencyAlert from '@/core/Models/EmergencyAlert.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getUserById, updateById } from '@/core/Helpers/queryHelpers.js';

/**
 * SOSService (Traveller Role)
 */
class SOSService {
    async updateEmergencyContacts(userId, emergencyContacts = []) {
        const updatedUser = await updateById(
            User,
            userId,
            { $set: { emergencyContacts } },
            { runValidators: true }
        );
        if (!updatedUser) throw AppError.notFound(RESPONSE_MESSAGES.USER.NOT_FOUND);
        return updatedUser;
    }

    async triggerSOS(userId, location) {
        const { latitude, longitude, address } = location;
        const user = await getUserById(userId);
        if (!user) throw AppError.notFound(RESPONSE_MESSAGES.USER.NOT_FOUND);

        const alert = await EmergencyAlert.create({
            userId,
            location: { latitude, longitude, address },
            status: 'active'
        });

        NotificationService.notifyEmergency(user, alert);
        return alert;
    }
}

export default new SOSService();

