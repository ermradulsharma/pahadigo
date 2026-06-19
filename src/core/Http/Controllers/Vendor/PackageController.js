import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import PackageService from '@/core/Services/Vendor/PackageService.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { VendorService } from '@/core/Services/Admin/index.js';
import Vendor from '@/core/Models/Vendor.js';

/**
 * PackageController (Vendor Role) - Comprehensive management of vendor catalogs and service items.
 * Fully synchronized with the modular route hub for enterprise-grade inventory management.
 */
class PackageController extends Controller {

    // GET /vendor/packages
    async getPackages(req) {
        try {
            const url = new URL(req.url, 'http://localhost');
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;
            const userId = req.user.id;

            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const packages = await PackageService.getPackages(userId, vendor._id, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, packages);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/packages
    async createPackage(req) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.initializeVendorPackage(userId, vendor._id, body);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.PACKAGE.CREATED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/packages/:id
    async getPackageById(req, { params }) {
        try {
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.getPackageById(params.id);

            if (!pkg || pkg.vendor.toString() !== vendor._id.toString()) {
                return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND_OR_UNAUTHORIZED);
            }
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/packages/:id
    async updatePackage(req, { params }) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.updatePackage(params.id, userId, vendor._id, body);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.UPDATED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /vendor/packages/:id
    async deletePackage(req, { params }) {
        try {
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            await PackageService.deletePackage(params.id, userId, vendor._id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.DELETED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/packages/:id/status
    async togglePackageStatus(req, { params }) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.updatePackageStatus(params.id, userId, vendor._id, body.isActive);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.STATUS_UPDATED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // --- ITEM/SERVICE ACTIONS (Adding specific homestays, hotel rooms, etc) ---

    // POST /vendor/package/add-item
    async addPackageItem(req, { params } = {}) {
        return this.savePackageItem(req, { params, isUpdate: false });
    }

    // PATCH /vendor/package/update-item (Modify service item details)
    async updatePackageItem(req, { params } = {}) {
        return this.savePackageItem(req, { params, isUpdate: true });
    }

    // Unify package saving controller logic (both addition and update)
    async savePackageItem(req, { params = {}, isUpdate } = {}) {
        try {
            const body = req.payload;
            const category = body.category;
            if (!category) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ITEM.CATEGORY_REQUIRED);

            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            let itemData = body;
            let itemId = null;
            if (isUpdate) {
                itemId = params?.itemId || body.itemId;
            }
            await isUpdate ? await PackageService.updateItem(userId, vendor._id, category, itemId, itemData) : await PackageService.addItem(userId, vendor._id, category, itemData);
            if (isUpdate) {
                return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.UPDATED);
            } else {
                return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.ITEM.ADDED);
            }
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/package/item/:category/:itemId
    async getPackageItem(req, { params } = {}) {
        try {
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const { category, itemId } = params;
            const schemaKey = CATEGORY_MAP[category] || category;
            const pkg = await PackageService.ensureCatalog(userId, vendor._id);
            if (pkg[schemaKey] === undefined) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.CATEGORY.INVALID);
            const item = pkg[schemaKey].id(itemId);
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ITEM.NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, item);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }



    // DELETE /vendor/package/delete-item
    async removePackageItem(req, { params } = {}) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const itemId = params.itemId || body.itemId;
            const category = (body.category || params.category || '').trim();

            await PackageService.removeItem(userId, vendor._id, category, itemId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
        } catch (error) {
            const status = error.message.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
            return this.error(status, error.message);
        }
    }

    // POST /vendor/package/toggle-item
    async togglePackageItemStatus(req, { params } = {}) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const itemId = params.itemId || body.itemId;
            const category = (body.category || '').trim();
            let { isActive } = body;
            if (typeof isActive === 'string') {
                isActive = isActive.trim().toLowerCase() === 'true';
            }
            const result = await PackageService.toggleItemStatus(userId, vendor._id, category, itemId, isActive);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.STATUS_UPDATED, result);
        } catch (error) {
            const status = error.message.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
            return this.error(status, error.message);
        }
    }

    // POST /vendor/package/toggle-category
    async toggleCategoryStatus(req) {
        try {
            const body = req.payload;
            const userId = req.user.id;
            const vendor = await Vendor.findOne({ user: userId }).select("_id");
            if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const category = (body.category || '').trim();
            const { isActive } = body;

            await PackageService.toggleCategoryStatus(userId, vendor._id, category, isActive);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.CATEGORY_STATUS_UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const packageController = new PackageController();
export default packageController;
