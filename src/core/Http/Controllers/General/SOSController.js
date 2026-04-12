import SOSService from '@/services/General/SOSService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

/**
 * SOSController (General/Public Role)
 * Handles emergency contact management for authenticated users.
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
        return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.ERROR.UNAUTHORIZED);
      }

      const updatedUser = await SOSService.updateEmergencyContacts(user.id, emergencyContacts);

      return successResponse(HTTP_STATUS.OK, 'Emergency contacts updated successfully.', {
        emergencyContacts: updatedUser.emergencyContacts,
      });
    } catch (error) {
      console.error('[SOSController] updateEmergencyContacts error:', error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

export default new SOSController();
