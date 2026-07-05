import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * BusinessController (Vendor Role) - Specialized management of
 * Core Business Identity and Platform Availability status.
 */
class BusinessController extends Controller {

    // GET /vendor/business/profile
    async getProfile(req) {
        try {
            const vendor = await BusinessService.getBusinessProfile(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, vendor);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/business/profile/create
    async createProfile(req) {
        try {
            const existingProfile = await BusinessService.getBusinessByUserId(req.user.id);
            if (existingProfile) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.PROFILE_ALREADY_EXISTS);
            }
            const body = req.payload;
            if (req.formDataBody?.get('profile_image')) {
                const res = await uploadToCloudinary(req.formDataBody.get('profile_image'), `vendor_profiles/${req.user.id}`);
                body.profileImage = res.url;
            }
            const vendor = await BusinessService.syncBusinessProfile(req.user.id, body);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.PROFILE_INITIATED, vendor);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /vendor/business/profile/update/:id
    async updateProfile(req, { params }) {
        try {
            const body = req.payload;
            if (req.formDataBody?.get('profile_image')) {
                const res = await uploadToCloudinary(req.formDataBody.get('profile_image'), `vendor_profiles/${req.user.id}`);
                body.profileImage = res.url;
            }
            const vendor = await BusinessService.syncBusinessProfile(req.user.id, body);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PROFILE_UPDATED, vendor);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /vendor/business/profile/delete/:id
    async deleteProfile(req, { params }) {
        try {
            const result = await BusinessService.removeBusinessProfile(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PROFILE_DELETED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /vendor/business/profile/status/:id
    async updateOperatingStatus(req, { params }) {
        try {
            const body = req.payload;
            if (body.isOperating === undefined) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.OPERATING_STATUS_REQUIRED);
            }

            const isOperating = body.isOperating === 'true' || body.isOperating === true;
            const result = await BusinessService.toggleOperatingStatus(req.user.id, isOperating);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.OPERATING_STATUS_UPDATED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const businessController = new BusinessController();
export default businessController;
