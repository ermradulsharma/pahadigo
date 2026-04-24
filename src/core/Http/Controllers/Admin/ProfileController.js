import { BaseAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { transformAuthResponse } from '@/core/Helpers/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { parseBody } from '@/core/Helpers/parseBody.js';
import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';

/**
 * ProfileController (Admin Role)
 * Dedicated controller for Admin's own profile management.
 */
class ProfileController extends Controller {

    // GET /admin/profile
    async getProfile(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const userProfile = await BaseAuthService.getUserProfile(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, transformAuthResponse(userProfile));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /admin/profile
    async updateProfile(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            
            let body = req.formDataBody ? parseNestedFormData(req.formDataBody) : (req.validData || req.jsonBody || await parseBody(req));

            // Handle Profile Image Upload
            if (req.formDataBody?.get('profileImage') instanceof File) {
                const result = await uploadToCloudinary(req.formDataBody.get('profileImage'), `profile/admin/${req.user.id}`);
                body.profileImage = result.url;
            }

            // Prevent elevation of privileges
            const { password, role, status, _id, ...updates } = body;
            
            const updatedUser = await BaseAuthService.updateUserProfile(req.user.id, updates);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED, transformAuthResponse(updatedUser));
        } catch (error) {
            console.error("[Admin.ProfileController.updateProfile] Error:", error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
