import PackageService from '@/core/Services/Vendor/PackageService.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';

/**
 * PackageController (Vendor Role) - Comprehensive management of vendor catalogs and service items.
 * Fully synchronized with modular route hubs for enterprise-grade inventory management.
 */
class PackageController extends Controller {

    // Helper: Resolves Vendor ID for logged-in user using queryHelpers
    async _getVendorId(userId) {
        const vendor = await getBusinessByUserId(userId, '_id');
        return vendor?._id ? vendor._id.toString() : null;
    }

    // GET /vendor/packages
    async getPackages(req) {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            const url = new URL(req.url, baseUrl);
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 10;

            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const packages = await PackageService.getPackages(req.user.id, vendorId, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, packages);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /vendor/packages
    async createPackage(req) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.initializeVendorPackage(req.user.id, vendorId);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.PACKAGE.CREATED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/packages/:id
    async getPackageById(req, { params }) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.getPackageById(params.id);
            if (!pkg || pkg.vendor.toString() !== vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND_OR_UNAUTHORIZED);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/packages/:id
    async updatePackage(req, { params }) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.updatePackage(params.id, req.user.id, vendorId, req.payload);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.UPDATED, pkg);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /vendor/packages/:id
    async deletePackage(req, { params }) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            await PackageService.deletePackage(params.id, req.user.id, vendorId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.DELETED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PUT /vendor/packages/:id/status
    async togglePackageStatus(req, { params }) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const pkg = await PackageService.updatePackageStatus(params.id, req.user.id, vendorId, req.payload?.isActive);
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

    // Unified package saving controller logic (both addition and update)
    async savePackageItem(req, { params = {}, isUpdate } = {}) {
        try {
            const body = req.payload || {};
            const category = body.category;
            if (!category) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ITEM.CATEGORY_REQUIRED);

            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const itemId = isUpdate ? (params?.itemId || body.itemId) : null;
            if (isUpdate) {
                await PackageService.updateItem(req.user.id, vendorId, category, itemId, body);
                return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.UPDATED);
            } else {
                await PackageService.addItem(req.user.id, vendorId, category, body);
                return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.ITEM.ADDED);
            }
        } catch (error) {
            if (error.name === 'ValidationError') {
                return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
            }
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /vendor/package/item/:category/:itemId
    async getPackageItem(req, { params } = {}) {
        try {
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const { category, itemId } = params;
            const schemaKey = CATEGORY_MAP[category] || category;
            const pkg = await PackageService.ensureCatalog(req.user.id, vendorId);
            if (pkg[schemaKey] === undefined) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.CATEGORY.INVALID);

            const item = Array.isArray(pkg[schemaKey]) ? pkg[schemaKey].find(i => i._id.toString() === itemId) : null;
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ITEM.NOT_FOUND);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, item);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /vendor/package/delete-item
    async removePackageItem(req, { params } = {}) {
        try {
            const body = req.payload || {};
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const itemId = params.itemId || body.itemId;
            const category = (body.category || params.category || '').trim();

            await PackageService.removeItem(req.user.id, vendorId, category, itemId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
        } catch (error) {
            const status = error.message?.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
            return this.error(status, error.message);
        }
    }

    // POST /vendor/package/toggle-item
    async togglePackageItemStatus(req, { params } = {}) {
        try {
            const body = req.payload || {};
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const itemId = params.itemId || body.itemId;
            const category = (body.category || '').trim();
            let isActive = body.isActive;
            if (typeof isActive === 'string') isActive = isActive.trim().toLowerCase() === 'true';
            const result = await PackageService.toggleItemStatus(req.user.id, vendorId, category, itemId, isActive);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.STATUS_UPDATED, result);
        } catch (error) {
            const status = error.message?.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
            return this.error(status, error.message);
        }
    }

    // POST /vendor/package/toggle-category
    async toggleCategoryStatus(req) {
        try {
            const body = req.payload || {};
            const vendorId = await this._getVendorId(req.user.id);
            if (!vendorId) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            const category = (body.category || '').trim();
            const { isActive } = body;

            await PackageService.toggleCategoryStatus(req.user.id, vendorId, category, isActive);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.CATEGORY_STATUS_UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const packageController = new PackageController();
export default packageController;
