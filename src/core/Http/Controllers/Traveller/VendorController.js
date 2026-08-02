import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { getBusinessById, getBusinessBy, getPackageBy, getUserById } from "@/core/Helpers/queryHelpers.js";
import { itemsFormate } from '@/core/Helpers/package.js';
import Controller from '../Controller.js';

class VendorController extends Controller {

    // GET /traveller/profile/vendor/info/:userId
    async getVendorPersonalInfo(req, { params }) {
        try {
            const user = await getUserById(params.userId, 'name email phone profileImage gender dateOfBirth bio address status isVendorVerified');
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);
            let businessDetails = null;
            const business = await getBusinessBy({ user: params.userId }, 'businessAbout businessName businessNumber businessRegistration profileImage gstNumber ownerName status trustBadge address');
            if (business) {
                const packages = await getPackageBy({ vendor: business._id }) || {};
                const items = itemsFormate(packages);
                businessDetails = {
                    ...business,
                    items
                };
            }
            const responseData = {
                ...user,
                businessDetails
            };
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /traveller/profile/vendor/:businessId
    async getBusinessProfile(req, { params }) {
        try {
            const business = await getBusinessById(params.businessId, 'businessAbout businessName businessNumber businessRegistration profileImage gstNumber ownerName status trustBadge address', { path: 'user', select: 'email phone profileImage isVendorVerified' });
            if (!business) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const packages = await getPackageBy({ vendor: params.businessId }) || {};
            const items = itemsFormate(packages);
            const responseData = {
                ...business,
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
