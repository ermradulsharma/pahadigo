import SOSService from '@/core/Services/Traveller/SOSService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * SOSController (Traveller Role)
 */
class SOSController extends Controller {

  // PATCH /traveller/emergency-contacts
  async updateEmergencyContacts(req) {
    try {
      const body = req.payload || req.jsonBody || await req.json();
      const rawContacts = body?.emergencyContacts ?? body?.emergencyContact;

      let emergencyContacts = null;
      if (Array.isArray(rawContacts)) {
        emergencyContacts = rawContacts;
      } else if (rawContacts && typeof rawContacts === 'object') {
        emergencyContacts = [rawContacts];
      }

      if (!emergencyContacts) {
        return this.error(HTTP_STATUS.BAD_REQUEST, 'emergencyContacts must be an array.');
      }

      const updatedUser = await SOSService.updateEmergencyContacts(req.user.id, emergencyContacts);
      return this.success(HTTP_STATUS.OK, 'Emergency contacts updated successfully.', { emergencyContacts: updatedUser.emergencyContacts });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /traveller/sos
  async triggerSOS(req) {
    try {
      const location = req.validData || req.jsonBody || await req.json();
      const alert = await SOSService.triggerSOS(req.user.id, location);
      return this.success(HTTP_STATUS.CREATED, 'SOS Alert Triggered. Help is being contacted.', { alertId: alert._id });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const sosController = new SOSController();
export default sosController;
