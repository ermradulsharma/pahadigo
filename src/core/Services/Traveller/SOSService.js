import User from '@/core/Models/User.js';
import EmergencyAlert from '@/core/Models/EmergencyAlert.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

/**
 * SOSService (Traveller Role)
 */
class SOSService {
    async updateEmergencyContacts(userId, emergencyContacts = []) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { emergencyContacts } },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updatedUser) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);
        return updatedUser;
    }

    async triggerSOS(userId, location) {
        const { latitude, longitude, address } = location;
        const user = await User.findById(userId);
        if (!user) throw new Error(RESPONSE_MESSAGES.USER.NOT_FOUND);

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
