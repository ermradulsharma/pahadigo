import User from '@/models/User.js';
import EmergencyAlert from '@/models/EmergencyAlert.js';
import NotificationService from '@/services/NotificationService.js';

/**
 * SOSService (Traveller Role)
 */
class SOSService {
    async updateEmergencyContacts(userId, emergencyContacts = []) {
        if (!Array.isArray(emergencyContacts) || emergencyContacts.length > 3) {
            throw new Error('Must be an array of max 3 contacts');
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
        if (!user) throw new Error("User not found");

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
