import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import { BaseAuthService } from '@/services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS } from '@/constants/index.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { transformAuthResponse } from '@/helpers/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * ProfileController (Vendor Role) - Specialized management of
 * the vendor's personal account, identity, and personal contact info.
 */
class ProfileController extends Controller {

  // GET /vendor/me
  async getProfile(req) {
    try {
      const result = await BaseAuthService.getUserProfile(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /vendor/status
  async toggleAccountStatus(req) {
    try {
      const { status } = req.payload;
      if (typeof status !== 'boolean') {
        return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_REQUEST);
      }
      const user = await User.findById(req.user.id);
      if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);
      if (status === true && (user.status === STATUS.BLOCKED || user.status === STATUS.SUSPENDED)) {
        return this.error(HTTP_STATUS.FORBIDDEN, "This account is restricted by administration.");
      }
      if (status === true) {
        user.status = user.isVerified === true ? STATUS.ACTIVE : STATUS.PENDING;
      } else {
        user.status = STATUS.INACTIVE;
      }
      await user.save();
      const message = `Account ${status ? 'activated' : 'deactivated'} successfully`;
      return this.success(HTTP_STATUS.OK, message, { status: user.status });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // PATCH /vendor/update
  async updateProfile(req) {
    try {
      const body = req.payload;
      if (req.formDataBody?.get('profileImage')) {
        const res = await uploadToCloudinary(req.formDataBody.get('profileImage'), `profile/${req.user.id}`);
        body.profileImage = res.url;
      }
      const allowedFields = [
        'name', 'gender', 'dateOfBirth', 'bloodGroup',
        'designation', 'bio', 'website', 'socialLinks',
        'emergencyContacts', 'address', 'preferences', 'profileImage'
      ];
      const updates = {};
      Object.keys(body).forEach(key => {
        if (allowedFields.includes(key)) updates[key] = body[key];
      });
      if (body.emergencyContact && !body.emergencyContacts) {
        updates.emergencyContacts = [body.emergencyContact];
      }
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { returnDocument: 'after', runValidators: true }
      ).select('-password');
      return this.success(HTTP_STATUS.OK, "Personal profile updated successfully", user);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /vendor/avatar
  async updateProfileImage(req) {
    try {
      const formDataBody = req.formDataBody;
      if (!formDataBody || !formDataBody.get('avatar')) {
        return this.error(HTTP_STATUS.BAD_REQUEST, "Avatar file is required");
      }
      const avatarFile = formDataBody.get('avatar');
      const result = await uploadToCloudinary(avatarFile, `vendor_avatars/${req.user.id}`);
      const user = await User.findByIdAndUpdate(req.user.id, {
        $set: { avatar: result.url }
      }, { returnDocument: 'after' }).select('-password');
      return this.success(HTTP_STATUS.OK, "Personal avatar updated successfully", user);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const profileController = new ProfileController();
export default profileController;
