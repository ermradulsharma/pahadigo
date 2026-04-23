import SOSService from '@/core/Services/General/SOSService.js';
import TravellerSOSService from '@/core/Services/Traveller/SOSService.js';
import { successResponse, errorResponse } from '@/core/Helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';

/**
 * SOSController (General/Shared Role)
 * Handles SOS and emergency contact management for any authenticated user (Traveller or Vendor).
 */
class SOSController {
  /**
   * PATCH /auth/emergency-contacts
   * Updates the authenticated user's emergency contacts.
   */
  async updateEmergencyContacts(req) {
    try {
      const { emergencyContacts } = req.jsonBody || {};

      if (!emergencyContacts || !Array.isArray(emergencyContacts)) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, 'emergencyContacts must be an array.');
      }

      const user = req.user;
      if (!user) {
        return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
      }

      const updatedUser = await SOSService.updateEmergencyContacts(user.id, emergencyContacts);

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SOS.CONTACTS_UPDATED, {
        emergencyContacts: updatedUser.emergencyContacts,
      });
    } catch (error) {
      console.error('[SOSController] updateEmergencyContacts error:', error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  /**
   * POST /traveller/sos or /vendor/sos
   * Triggers an SOS emergency alert for any authenticated user.
   */
  async triggerSOS(req) {
    try {
      const location = req.validData || req.jsonBody || {};
      const alert = await TravellerSOSService.triggerSOS(req.user.id, location);
      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SOS.ALERT_TRIGGERED, { alertId: alert._id });
    } catch (error) {
      console.error('[SOSController] triggerSOS error:', error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

export default new SOSController();
