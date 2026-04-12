import BusinessService from '@/services/Vendor/BusinessService.js';
import PackageService from '@/services/Vendor/PackageService.js';
import { CATEGORY_MAP } from '@/constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';

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

      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const packages = await PackageService.getPackages(vendor._id, page, limit);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, packages);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /vendor/packages
  async createPackage(req) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const pkg = await PackageService.initializeVendorPackage(vendor._id, body);
      return this.success(HTTP_STATUS.CREATED, "Package created successfully", pkg);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /vendor/packages/:id
  async getPackageById(req, { params }) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      const pkg = await PackageService.getPackageById(params.id);

      if (!pkg || pkg.vendor.toString() !== vendor._id.toString()) {
        return this.error(HTTP_STATUS.NOT_FOUND, "Package not found or unauthorized");
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
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      const pkg = await PackageService.updatePackage(params.id, vendor._id, body);
      return this.success(HTTP_STATUS.OK, "Package updated successfully", pkg);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /vendor/packages/:id
  async deletePackage(req, { params }) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      await PackageService.deletePackage(params.id, vendor._id);
      return this.success(HTTP_STATUS.OK, "Package deleted successfully");
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PUT /vendor/packages/:id/status
  async togglePackageStatus(req, { params }) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      const pkg = await PackageService.updatePackageStatus(params.id, vendor._id, body.isActive);
      return this.success(HTTP_STATUS.OK, "Package status updated", pkg);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // --- ITEM/SERVICE ACTIONS (Adding specific homestays, hotel rooms, etc) ---

  // POST /vendor/package/add-item
  async addPackageItem(req, { params } = {}) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const category = (body.category?._id || body.category || '').trim();

      // Handle item[0][key] style format from Postman/CURL
      let itemData = body.itemData || body;
      if (body.item && Array.isArray(body.item)) {
        itemData = body.item[0];
      } else if (body.item && typeof body.item === 'object' && body.item['0']) {
        itemData = body.item['0'];
      }
      // --- [MEDIA] Explicit File Upload Logic for Package Items ---
      if (itemData.photos) {
        const photos = Array.isArray(itemData.photos) ? itemData.photos : [itemData.photos];
        const uploadResults = [];

        for (const photo of photos) {
          // Detect if it's a File object from multipart/form-data
          if (photo && typeof photo === 'object' && (photo instanceof File || photo.size > 0)) {
            try {
              const uploaded = await uploadToCloudinary(photo, `packages/${vendor._id}/${category}`);
              uploadResults.push({ url: uploaded.url, type: 'image' });
            } catch (err) {
              console.error(`[PACKAGE_CONTROLLER] Item image upload failed:`, err);
            }
          } else if (typeof photo === 'object' && photo.url) {
            // Preservation of existing photo objects during re-save
            uploadResults.push(photo);
          } else if (typeof photo === 'string' && photo.startsWith('http')) {
            uploadResults.push({ url: photo, type: 'image' });
          }
        }

        if (uploadResults.length > 0) itemData.photos = uploadResults;
        else delete itemData.photos;
      }

      const item = await PackageService.addItem(vendor._id, category, itemData);
      return this.success(HTTP_STATUS.CREATED, "Service item added", item);
    } catch (error) {
      const status = error.message.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
      return this.error(status, error.message);
    }
  }

  // GET /vendor/package/item/:category/:itemId
  async getPackageItem(req, { params } = {}) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
      const { category, itemId } = params;
      const schemaKey = CATEGORY_MAP[category] || category;
      const pkg = await PackageService.ensureCatalog(vendor.user);
      if (pkg[schemaKey] === undefined) return this.error(HTTP_STATUS.BAD_REQUEST, "Invalid category");
      const item = pkg[schemaKey].id(itemId);
      if (!item) return this.error(HTTP_STATUS.NOT_FOUND, "Item not found");
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, item);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /vendor/package/update-item (Modify service item details)
  async updatePackageItem(req, { params } = {}) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.findByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const itemId = params.itemId || body.itemId;
      const category = (body.category || params.category || '').trim();
      const updates = body.updates || body;

      // --- [MEDIA] Explicit File Upload Logic for Updates ---
      if (updates.photos) {
        const photos = Array.isArray(updates.photos) ? updates.photos : [updates.photos];
        const uploadResults = [];

        for (const photo of photos) {
          if (photo && typeof photo === 'object' && (photo instanceof File || photo.size > 0)) {
            try {
              const uploaded = await uploadToCloudinary(photo, `packages/${vendor._id}/${category}`);
              uploadResults.push({ url: uploaded.url, type: 'image' });
            } catch (err) {
              console.error(`[PACKAGE_CONTROLLER] Update image upload failed:`, err);
            }
          } else if (typeof photo === 'object' && photo.url) {
            uploadResults.push(photo);
          } else if (typeof photo === 'string' && photo.startsWith('http')) {
            uploadResults.push({ url: photo, type: 'image' });
          }
        }
        if (uploadResults.length > 0) updates.photos = uploadResults;
      }

      const result = await PackageService.updateItem(vendor._id, category, itemId, updates);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, result);
    } catch (error) {
      const status = error.message.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
      return this.error(status, error.message);
    }
  }

  // DELETE /vendor/package/delete-item
  async removePackageItem(req, { params } = {}) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      const itemId = params.itemId || body.itemId;
      const category = (body.category || params.category || '').trim();

      await PackageService.removeItem(vendor._id, category, itemId);
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
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const itemId = params.itemId || body.itemId;
      const category = (body.category || '').trim();
      let { isActive } = body;
      if (typeof isActive === 'string') {
        isActive = isActive.trim().toLowerCase() === 'true';
      }
      const result = await PackageService.toggleItemStatus(vendor._id, category, itemId, isActive);
      return this.success(HTTP_STATUS.OK, "Item status updated", result);
    } catch (error) {
      const status = error.message.toLowerCase().includes('authorized') ? HTTP_STATUS.FORBIDDEN : HTTP_STATUS.BAD_REQUEST;
      return this.error(status, error.message);
    }
  }

  // POST /vendor/package/toggle-category
  async toggleCategoryStatus(req) {
    try {
      const body = req.payload;
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      const category = (body.category || '').trim();
      const { isActive } = body;

      await PackageService.toggleCategoryStatus(vendor._id, category, isActive);
      return this.success(HTTP_STATUS.OK, "Category status updated");
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const packageController = new PackageController();
export default packageController;
