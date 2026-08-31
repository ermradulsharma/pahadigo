import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import { getBusinessById, getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { handleFormDataImageUpload } from '@/core/Helpers/cloudinary.js';
import { businessAuthResponse, businessDetailsFormat } from '@/core/Helpers/userProfileHelper.js';
import Controller from '@/core/Controllers/Controller.js';
import VendorEvents from '@/core/Events/VendorEvents.js';

/**
 * BusinessController (Vendor Role) - Specialized management of
 * Core Business Identity and Platform Availability status.
 */
class BusinessController extends Controller {

    /**
     * Private Helper: Prepare request payload & process optional profile image upload (DRY)
     */
    async _prepareProfileBody(req) {
        const body = req.payload || {};
        const profileImage = await handleFormDataImageUpload(req.formDataBody, 'profile_image', `vendor_profiles/${req.user.id}`);
        if (profileImage) body.profileImage = profileImage;
        return body;
    }

    // GET /vendor/business/profile
    async getProfile(req) {
        try {
            const vendor = await getBusinessByUserId(req.user.id);
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const responseData = businessAuthResponse(vendor);
            if (vendor.closurePeriods) responseData.closurePeriods = vendor.closurePeriods;
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/business/profile/create (Onboarding - strictly 1-time creation)
    async createProfile(req) {
        try {
            const userId = req.user.id;
            const existingProfile = await getBusinessByUserId(userId);
            if (existingProfile) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.PROFILE_ALREADY_EXISTS);

            const body = await this._prepareProfileBody(req);
            const vendor = await BusinessService.syncBusinessProfile(userId, body);
            if (vendor.user?.email) VendorEvents.emit('vendor.profile_created', { identifier: vendor.user.email, businessName: vendor.businessName });

            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.PROFILE_INITIATED, businessAuthResponse(vendor));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /vendor/business/profile/update/:id (Updates - check existence by params.id)
    async updateProfile(req, { params }) {
        try {
            const userId = req.user?.id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);

            const businessId = params?.id;
            const existingProfile = (businessId ? await getBusinessById(businessId) : null) || await getBusinessByUserId(userId);
            if (!existingProfile) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const ownerUserId = existingProfile.user?._id ? existingProfile.user._id.toString() : (existingProfile.user ? existingProfile.user.toString() : null);
            if (ownerUserId !== userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.ERROR.UNAUTHORIZED);

            const body = await this._prepareProfileBody(req);
            const vendor = await BusinessService.syncBusinessProfile(userId, body);
            if (vendor.user?.email) VendorEvents.emit('vendor.profile_updated', { identifier: vendor.user.email, businessName: vendor.businessName });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PROFILE_UPDATED, businessAuthResponse(vendor));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /vendor/business/profile/delete/:id (Delete - check existence by params.id)
    async deleteProfile(req, { params }) {
        try {
            const userId = req.user?.id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);

            const businessId = params?.id;
            const existingVendor = (businessId ? await getBusinessById(businessId) : null) || await getBusinessByUserId(userId);
            if (!existingVendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const ownerUserId = existingVendor.user?._id ? existingVendor.user._id.toString() : (existingVendor.user ? existingVendor.user.toString() : null);
            if (ownerUserId !== userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.ERROR.UNAUTHORIZED);

            const result = await BusinessService.removeBusinessProfile(userId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PROFILE_DELETED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /vendor/business/profile/status/:id (Status Toggle - check existence by params.id)
    async updateOperatingStatus(req, { params }) {
        try {
            const isOperating = req.payload?.isOperating === true || req.payload?.isOperating === 'true';
            const businessId = params?.id;

            const result = await BusinessService.toggleOperatingStatus(req.user.id, isOperating, businessId);
            if (!result) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.OPERATING_STATUS_UPDATED, businessDetailsFormat(result));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const businessController = new BusinessController();
export default businessController;
