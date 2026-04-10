import ProfileService from '@/services/Traveller/ProfileService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '../Controller.js';

/**
 * ProfileController (Traveller Role)
 */
class ProfileController extends Controller {

    // GET /traveller/profile
    async getProfile(req) {
        try {
            const user = await ProfileService.getProfile(req.user.id);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { user });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /traveller/profile
    async updateProfile(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const user = await ProfileService.updateProfile(req.user.id, body);
            return this.success(HTTP_STATUS.OK, "Profile updated successfully", { user });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /traveller/profile/avatar
    async updateAvatar(req) {
        try {
            const formDataBody = req.formDataBody;
            if (!formDataBody || !formDataBody.get('avatar')) {
                return this.error(HTTP_STATUS.BAD_REQUEST, "Avatar file is required");
            }

            const avatarFile = formDataBody.get('avatar');
            const user = await ProfileService.updateAvatar(req.user.id, avatarFile);

            return this.success(HTTP_STATUS.OK, "Avatar updated successfully", { user });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
