import User from '@/models/User.js';
import EmergencyAlert from '@/models/EmergencyAlert.js';
import NotificationService from '@/services/NotificationService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class SOSController {
    
    // PATCH /auth/emergency-contacts
    async updateEmergencyContacts(req) {
        try {
            const user = req.user;
            if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const body = req.jsonBody || await req.json();
            const { emergencyContacts } = body;

            if (!Array.isArray(emergencyContacts)) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'emergencyContacts must be an array', {});
            }

            // Validation: Ensure max 3 contacts, and all have name and phone
            if (emergencyContacts.length > 3) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'You can add a maximum of 3 emergency contacts.', {});
            }

            for (const contact of emergencyContacts) {
                if (!contact.name || !contact.phone) {
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Each emergency contact must have a name and phone number.', {});
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                user.id,
                { $set: { emergencyContacts } },
                { returnDocument: 'after', runValidators: true }
            );

            return successResponse(HTTP_STATUS.OK, 'Emergency contacts updated successfully.', { emergencyContacts: updatedUser.emergencyContacts });
        } catch (error) {
            console.error("updateEmergencyContacts error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /traveller/sos
    async triggerSOS(req) {
        try {
            const userTokenObj = req.user;
            if (!userTokenObj) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

            const body = req.jsonBody || await req.json();
            const { latitude, longitude, address } = body;

            // Fetch full user to get emergency contacts
            const user = await User.findById(userTokenObj.id);
            if (!user) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});

            // Create Alert Document
            const alert = await EmergencyAlert.create({
                userId: user._id,
                location: {
                    latitude,
                    longitude,
                    address
                },
                status: 'active'
            });

            // Fire off background notifications (SMS, Email, Push)
            NotificationService.notifyEmergency(user, alert);

            return successResponse(HTTP_STATUS.CREATED, 'SOS Alert Triggered. Help is being contacted.', { alertId: alert._id });
        } catch (error) {
            console.error("triggerSOS error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const sosController = new SOSController();
export default sosController;
