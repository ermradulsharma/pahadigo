import InventoryService from '@/services/Vendor/InventoryService.js';
import PackageService from '@/services/Vendor/PackageService.js';
import BusinessService from '@/services/Vendor/BusinessService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * InventoryController (Vendor Role) - Handles stocks, availability, and smart pricing overrides.
 */
class InventoryController extends Controller {

  // GET /vendor/inventory/
  async getInventory(req) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
      const catalog = await PackageService.getInventory(vendor._id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.INVENTORY_FETCHED, catalog);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /vendor/inventory/:itemId
  async getInventoryItem(req, { params } = {}) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const url = new URL(req.url, 'http://localhost');
      const itemId = params.itemId || url.searchParams.get('itemId');
      let serviceType = params.serviceType || url.searchParams.get('serviceType');

      const startDate = url.searchParams.get('startDate') || new Date().toISOString();
      const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Auto-detect serviceType from itemId if missing
      if (itemId && !serviceType) {
        const itemInfo = await PackageService.getPackageItem(itemId);
        if (itemInfo) serviceType = itemInfo.category;
      }

      if (!serviceType) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.CATEGORY.MISSING_SERVICE_TYPE);

      const result = await InventoryService.getCategoryInventory(vendor._id, serviceType, startDate, endDate, itemId);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.INVENTORY_ITEM_FETCHED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /vendor/inventory/:itemId/update
  async updateInventory(req, { params } = {}) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const body = req.payload;
      const itemId = params.itemId || body.itemId;
      let serviceType = body.serviceType || (req.query && req.query.serviceType);
      const { startDate, endDate, applyToService } = body;

      // Auto-detect serviceType from itemId
      if (itemId && !serviceType) {
        const itemInfo = await PackageService.getPackageItem(itemId);
        if (itemInfo) serviceType = itemInfo.category;
      }

      if (!serviceType) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.CATEGORY.MISSING_SERVICE_TYPE);

      let inventory;
      if (applyToService === 'true' || applyToService === true) {
        inventory = await InventoryService.updateServiceInventoryRange(vendor._id, serviceType, startDate, endDate, body);
      } else {
        inventory = await InventoryService.updateInventoryRange(vendor._id, itemId, serviceType, startDate, endDate, body);
      }

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.INVENTORY_UPDATED, inventory);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /vendor/inventory/:itemId/baseline
  async updateBasePrice(req, { params } = {}) {
    try {
      const vendor = await BusinessService.getBusinessByUserId(req.user.id);
      if (!vendor) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

      const body = req.payload;
      const itemId = params.itemId || body.itemId;
      if (!itemId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED);

      // Find category automatically via Item ID
      const itemInfo = await PackageService.getPackageItem(itemId);
      if (!itemInfo || !itemInfo.category) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ITEM.NOT_FOUND_IN_CATEGORY);

      const category = itemInfo.category;
      const updates = body.updates || body;

      const updated = await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.BASELINE_UPDATED, updated);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const inventoryController = new InventoryController();
export default inventoryController;
