import User from '@/models/User.js';

/**
 * SOSService (General Role)
 * Handles emergency contact management for users.
 */
class SOSService {
    async updateEmergencyContacts(userId, emergencyContacts = []) {
        if (!Array.isArray(emergencyContacts) || emergencyContacts.length > 5) { // Adjusted limit for general use
            throw new Error('Must be an array of max 5 contacts');
        }

        return await User.findByIdAndUpdate(
            userId,
            { $set: { emergencyContacts } },
            { returnDocument: 'after', runValidators: true }
        );
    }
}

export default new SOSService();
