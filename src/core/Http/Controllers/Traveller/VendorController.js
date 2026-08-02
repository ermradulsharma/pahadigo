import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { getBusinessById, getPackageBy } from "@/core/Helpers/queryHelpers.js";
import Controller from '../Controller.js';

class VendorController extends Controller {

    // GET /traveller/profile/vendor/:businessId
    async getBusinessProfile(req, { params }) {
        try {
            const business = await getBusinessById(params.businessId, 'businessAbout businessName businessNumber businessRegistration gstNumber ownerName status trustBadge address', { path: 'user', select: 'email phone' });
            if (!business) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const packages = await getPackageBy({ vendor: params.businessId }) || {};
            const items = {};
            Object.values(SCHEMA_KEYS).forEach(key => {
                if (packages[key] && Array.isArray(packages[key])) {
                    items[key] = packages[key].map(item => ({
                        _id: item._id,
                        title: item.title,
                        slug: item.slug,
                        description: item.description,
                        pricing: item.pricing ? {
                            basePrice: item.pricing.basePrice,
                            gst: item.pricing.gst,
                            discountType: item.pricing.discountType,
                            discount: item.pricing.discount,
                            sellingPrice: item.pricing.sellingPrice
                        } : null,
                        location: item.location,
                        isActive: item.isActive,
                        photos: item.photos && item.photos.length > 0 ? item.photos[0] : null,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    }));
                } else {
                    items[key] = [];
                }
            });

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
