import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { getBusinessById, getBusinessByUserId, getPackageBy, getUserById } from "@/core/Helpers/queryHelpers.js";
import { itemsFormate } from '@/core/Helpers/package.js';
import { businessPayload, userPayload, userBusinessPayload } from '@/core/Helpers/userProfileHelper.js';
import Controller from '../Controller.js';

class VendorController extends Controller {

    // GET /traveller/profile/vendor/info/:userId
    async getVendorPersonalInfo(req, { params }) {
        try {
            const user = await getUserById(params.userId);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);
            const business = await getBusinessByUserId(params.userId);
            const responseData = userBusinessPayload(user, business);
            if (business && responseData?.businessDetails) {
                const packages = await getPackageBy({ vendor: business._id }) || {};
                responseData.businessDetails.items = itemsFormate(packages);
            }
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /traveller/profile/vendor/:businessId
    async getBusinessProfile(req, { params }) {
        try {
            const business = await getBusinessById(params.businessId, '', { path: 'user' });
            if (!business) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const packages = await getPackageBy({ vendor: params.businessId }) || {};
            const items = itemsFormate(packages);
            const responseData = {
                ...businessPayload(business),
                items
            };
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

}

const vendorController = new VendorController();
export default vendorController;
