import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import { BaseAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS } from '@/core/Constants/index.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { transformAuthResponse } from '@/core/Helpers/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import UserEvents from '@/core/Events/UserEvents.js';

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
                return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.VENDOR.ACCOUNT_RESTRICTED);
            }
            if (status === true) {
                user.status = user.isVerified === true ? STATUS.ACTIVE : STATUS.PENDING;
            } else {
                user.status = STATUS.INACTIVE;
            }
            await user.save();
            const message = status ? RESPONSE_MESSAGES.AUTH.ACTIVATED : RESPONSE_MESSAGES.AUTH.DEACTIVATED;
            return this.success(HTTP_STATUS.OK, message, { status: user.status });
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

            // 1. Safe profile image handling (prevent Cloudinary error on invalid/placeholder file inputs)
            const profileImgFile = req.formDataBody?.get('profileImage');
            if (profileImgFile && typeof profileImgFile === 'object' && typeof profileImgFile.arrayBuffer === 'function' && profileImgFile.size > 0) {
                const res = await uploadToCloudinary(profileImgFile, `profile/${req.user.id}`);
                updates.profileImage = res.url;
            } else if (typeof body.profileImage === 'string' && body.profileImage.trim() && !body.profileImage.startsWith('@postman')) {
                updates.profileImage = body.profileImage.trim();
            } else {
                delete updates.profileImage;
            }

            // 2. Emergency contacts normalization
            if (body.emergencyContact && !body.emergencyContacts) {
                const contact = typeof body.emergencyContact === 'object' ? body.emergencyContact : {};
                updates.emergencyContacts = [{
                    name: contact.name,
                    phone: contact.phone,
                    relationship: contact.relationship || contact.relation || null
                }];
            } else if (Array.isArray(updates.emergencyContacts)) {
                updates.emergencyContacts = updates.emergencyContacts.map(c => ({
                    name: c.name,
                    phone: c.phone,
                    relationship: c.relationship || c.relation || null
                }));
            }

            // 3. Comma-separated array & primitive conversions
            if (updates.expertise && typeof updates.expertise === 'string') {
                updates.expertise = updates.expertise.split(',').map(item => item.trim()).filter(Boolean);
            }
            if (updates.medicalConditions && typeof updates.medicalConditions === 'string') {
                updates.medicalConditions = updates.medicalConditions.split(',').map(item => item.trim()).filter(Boolean);
            }
            if (updates.experience !== undefined) {
                updates.experience = Number(updates.experience) || 0;
            }

            // 4. Notifications boolean normalization
            if (updates.preferences?.notifications) {
                Object.keys(updates.preferences.notifications).forEach(key => {
                    const val = updates.preferences.notifications[key];
                    updates.preferences.notifications[key] = val === true || val === 'true' || val === '1' || val === 1;
                });
            }

            // 5. Perform update via BaseAuthService (DRY principle)
            const user = await BaseAuthService.updateUserProfile(req.user.id, updates);

            if (user?.email) UserEvents.emit('user.profile_updated', { identifier: user.email, userName: user.name });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_UPDATED, user);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/avatar
    async updateProfileImage(req) {
        try {
            const formDataBody = req.formDataBody;
            if (!formDataBody || !formDataBody.get('avatar')) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
            }
            const avatarFile = formDataBody.get('avatar');
            const result = await uploadToCloudinary(avatarFile, `vendor_avatars/${req.user.id}`);
            const user = await User.findByIdAndUpdate(req.user.id, {
                $set: { avatar: result.url }
            }, { returnDocument: 'after' }).select('-password');
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_AVATAR_UPDATED, user);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/token
    async updateFCMToken(req) {
        try {
            const { fcmToken } = req.payload || {};
            if (!fcmToken) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
            }
            const user = await User.findByIdAndUpdate(req.user.id, { $set: { fcmToken } }, { returnDocument: 'after' }).select('-password');
            return this.success(HTTP_STATUS.OK, "FCM token updated successfully.", user);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
