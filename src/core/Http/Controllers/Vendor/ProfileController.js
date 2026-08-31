import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { BaseAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS } from '@/core/Constants/index.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { transformAuthResponse } from '@/core/Helpers/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import UserEvents from '@/core/Events/UserEvents.js';

import CacheService from '@/core/Services/CacheService.js';

/**
 * ProfileController (Vendor Role) - Specialized management of
 * the vendor's personal account, identity, and personal contact info.
 */
class ProfileController extends Controller {

    // GET /vendor/me
    async getProfile(req) {
        try {
            const result = await BaseAuthService.getUserProfile(req.user.id, true);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /vendor/status
    async toggleAccountStatus(req) {
        try {
            const { status } = req.payload;
            if (typeof status !== 'boolean') return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_REQUEST);

            const user = await User.findById(req.user.id);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);
            if (status === true && (user.status === STATUS.BLOCKED || user.status === STATUS.SUSPENDED)) return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.VENDOR.ACCOUNT_RESTRICTED);
            if (status === true) user.status = user.isVerified === true ? STATUS.ACTIVE : STATUS.PENDING;
            else user.status = STATUS.INACTIVE;
            await user.save();
            const message = status ? RESPONSE_MESSAGES.AUTH.ACTIVATED : RESPONSE_MESSAGES.AUTH.DEACTIVATED;
            return this.success(HTTP_STATUS.OK, message, user.status);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // PATCH /vendor/update
    async updateProfile(req) {
        try {
            const body = req.payload || {};
            const allowedFields = [
                'name', 'phone', 'gender', 'dateOfBirth', 'bloodGroup',
                'designation', 'bio', 'website', 'socialLinks', 'emergencyContacts',
                'address', 'preferences', 'profileImage', 'expertise',
                'medicalConditions', 'experience'
            ];
            const updates = {};
            Object.keys(body).forEach(key => {
                if (allowedFields.includes(key)) updates[key] = body[key];
            });

            // 1. Safe profile image handling
            const profileImgFile = req.payload?.profileImage;

            if (profileImgFile) {
                const res = await uploadToCloudinary(profileImgFile, `profile/${req.user.id}`);
                updates.profileImage = res.url;
            }

            // 2. Emergency contacts normalization
            if (updates.emergencyContacts) {
                const list = Array.isArray(updates.emergencyContacts) ? updates.emergencyContacts : [updates.emergencyContacts];
                updates.emergencyContacts = list.map(c => ({
                    name: c?.name,
                    phone: c?.phone,
                    relationship: c?.relationship
                }));
            }

            // 3. Comma-separated array & primitive conversions
            if (updates.expertise && typeof updates.expertise === 'string') updates.expertise = updates.expertise.split(',').map(item => item.trim()).filter(Boolean);
            if (updates.medicalConditions && typeof updates.medicalConditions === 'string') updates.medicalConditions = updates.medicalConditions.split(',').map(item => item.trim()).filter(Boolean);
            if (updates.experience !== undefined) updates.experience = Number(updates.experience) || 0;

            // 4. Notifications boolean normalization
            if (updates.preferences?.notifications) {
                Object.keys(updates.preferences.notifications).forEach(key => {
                    const val = updates.preferences.notifications[key];
                    updates.preferences.notifications[key] = val === true || val === 'true' || val === '1' || val === 1;
                });
            }

            // 5. GeoJSON Point calculation
            if (updates.address) mapToGeoJSON(updates.address, 'location');

            // 6. Delegate profile update to BaseAuthService for standardized response payload & Redis caching
            const updatedProfile = await BaseAuthService.updateUserProfile(req.user.id, updates);

            if (updatedProfile?.email) UserEvents.emit('user.profile_updated', { identifier: updatedProfile.email, userName: updatedProfile.name });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_UPDATED, updatedProfile);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/avatar
    async updateProfileImage(req) {
        try {
            const file = req.payload?.profileImage;
            if (!file) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const result = await uploadToCloudinary(file, `profile/${req.user.id}`);
            const updatedProfile = await BaseAuthService.updateUserProfile(req.user.id, { profileImage: result.url });

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_AVATAR_UPDATED, transformAuthResponse(updatedProfile));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/token
    async updateFCMToken(req) {
        try {
            const { fcmToken } = req.payload || {};
            if (!fcmToken) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const updatedProfile = await BaseAuthService.updateUserProfile(req.user.id, { fcmToken });
            return this.success(HTTP_STATUS.OK, "FCM token updated successfully.", transformAuthResponse(updatedProfile));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
