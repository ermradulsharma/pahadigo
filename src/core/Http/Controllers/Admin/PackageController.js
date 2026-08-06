import PackageService from '@/core/Services/Admin/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { item } from '@/core/Helpers/package.js';
import Vendor from '@/core/Models/Vendor.js';

/**
 * PackageController (Admin Role)
 * Platform-wide catalog management, service overrides, and inventory inspection.
 */
class PackageController extends Controller {

    // GET /admin/packages
    async getPackages(req) {
        try {
            const result = await PackageService.getAllServices();
            // Match legacy exactly: wrap in { packages }
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, {
                packages: result
            });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /admin/packages/:id/status
    async updateServiceStatus(req, { params }) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const { vendorId, userId, serviceType, status } = body;
            const serviceId = params?.id || body.serviceId;

            if (!serviceId || status === undefined) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
            }
            const updated = await PackageService.toggleServiceStatus(serviceId, status, serviceType, vendorId, userId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.STATUS_UPDATED, { updated });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/packages/item/:id
    async getPackageItem(req, { params }) {
        try {
            const item = await PackageService.getPackageItem(params.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED || "Item fetched", { item });
        } catch (error) {
            const status = error.message === "Item not found" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const msg = error.message === "Item not found" ? RESPONSE_MESSAGES.ERROR.NOT_FOUND : RESPONSE_MESSAGES.ERROR.SERVER_ERROR;
            return this.error(status, msg);
        }
    }

    // PATCH /admin/packages/item/:id
    async updatePackageItem(req, { params }) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const updatedItem = await PackageService.updatePackageItem(params.id, body || {});
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.UPDATED, { item: updatedItem });
        } catch (error) {
            const status = error.message === "Item not found" ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const msg = error.message === "Item not found" ? RESPONSE_MESSAGES.ERROR.NOT_FOUND : error.message;
            return this.error(status, msg);
        }
    }

    // POST /admin/add-package
    async addPackageOnBehalf(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const { vendorId, ...pkgData } = body;
            if (!vendorId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);

            const pkg = await PackageService.createPackage(vendorId, pkgData);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.PACKAGE.CREATED, { pkg });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/packages/add-item
    async addPackageItemOnBehalf(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const { vendorId, category, ...itemData } = body;

            if (!vendorId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
            if (!category) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ITEM.CATEGORY_REQUIRED);

            const vendor = await Vendor.findById(vendorId).select('user _id');
            if (!vendor || !vendor.user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const newItem = await item(vendor.user, vendor._id, category, itemData);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.ITEM.CREATED, newItem);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const packageController = new PackageController();
export default packageController;
