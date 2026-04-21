import NotificationService from '@/services/General/NotificationService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * SOSService (Traveller Role)
 */
class SOSService {
    async updateEmergencyContacts(userId, emergencyContacts = []) {
        if (!Array.isArray(emergencyContacts) || emergencyContacts.length > 3) {
            throw new Error(RESPONSE_MESSAGES.SOS.LIMIT_EXCEEDED);
        }

        return await User.findByIdAndUpdate(
            userId,
            { $set: { emergencyContacts } },
            { returnDocument: 'after', runValidators: true }
        );
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
