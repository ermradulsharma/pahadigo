import { HTTP_STATUS, RESPONSE_MESSAGES } from "@/core/Constants/index";
import User from "@/core/Models/User";
import BusinessService from "@/core/Services/Vendor/BusinessService";
import Controller from "../Controller";

class VendorController extends Controller {

    // GET /traveller/profile/vendor/:businessId
    async getBusinessProfile(req, { params }) {
        try {
            const business = await BusinessService.getBusinessProfile(params.businessId);
            if (!business) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, business);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

}

const vendorController = new VendorController();
export default vendorController;
