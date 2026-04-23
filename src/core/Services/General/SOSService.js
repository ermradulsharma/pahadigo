import User from '@/core/Models/User.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

/**
 * SOSService (General Role)
 * Handles emergency contact management for users.
 */
class SOSService {
  async updateEmergencyContacts(userId, emergencyContacts = []) {
    if (!Array.isArray(emergencyContacts) || emergencyContacts.length > 5) { // Adjusted limit for general use
      throw new Error(RESPONSE_MESSAGES.SOS.LIMIT_EXCEEDED);
    }

    return await User.findByIdAndUpdate(
      userId,
      { $set: { emergencyContacts } },
      { returnDocument: 'after', runValidators: true }
    );
  }
}

export default new SOSService();
