import InventoryService from '@/services/InventoryService.js';
import PackageService from '@/services/PackageService.js';
import VendorService from '@/services/VendorService.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class InventoryController {
    /**
     * GET /vendor/inventory/
     */
    async getAllInventory(req) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});
            const catalog = await PackageService.getVendorInventoryCatalog(vendor._id);
            return successResponse(HTTP_STATUS.OK, 'Packages retrieved successfully', catalog);
        } catch (error) {
            console.error('Get All Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    /**
     * GET /vendor/inventory/:itemId?serviceType=trekking&startDate=...&endDate=...
     */
    async getItemInventory(req, { params }) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            const { itemId } = (await params) || {};

            const url = new URL(req.url);
            let serviceType = url.searchParams.get('serviceType');
            const startDate = url.searchParams.get('startDate') || new Date().toISOString();
            const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            // Detect serviceType if missing using itemId
            if (itemId && !serviceType) {
                const itemInfo = await PackageService.getAvailablePackageItem(itemId);
                if (itemInfo) serviceType = itemInfo.category;
            }

            if (!itemId || !serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Item ID and serviceType specify are required (or valid itemId for auto-detection)', {});
            }

            const inventory = await InventoryService.getItemInventory(vendor._id, itemId, serviceType, startDate, endDate);
            return successResponse(HTTP_STATUS.OK, 'Inventory fetched successfully', inventory);
        } catch (error) {
            console.error('Get Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    /**
     * GET /vendor/inventory/service/:serviceType?startDate=...&endDate=...
     */
    async getServiceInventory(req, { params }) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            const p = (await params) || {};
            const serviceType = p.serviceType;

            const url = new URL(req.url);
            const startDate = url.searchParams.get('startDate') || new Date().toISOString();
            const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            if (!serviceType) return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Service type is required', {});

            const inventory = await InventoryService.getServiceInventory(vendor._id, serviceType, startDate, endDate);
            return successResponse(HTTP_STATUS.OK, 'Service inventory fetched successfully', inventory);
        } catch (error) {
            console.error('Get Service Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    /**
     * POST /vendor/inventory/:itemId/update
     * SMART API: Handles individual item updates, range updates, and category-level updates.
     */
    async updateInventory(req, { params }) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            const { itemId } = (await params) || {};

            let body;
            if (req.formDataBody) {
                body = parseNestedFormData(req.formDataBody);
            } else {
                body = req.jsonBody || await (req.json().catch(() => ({})));
            }

            let { serviceType, startDate, endDate, updates, applyToService } = body;

            // Detect serviceType if missing
            if (itemId && !serviceType) {
                const itemInfo = await PackageService.getAvailablePackageItem(itemId);
                if (itemInfo) serviceType = itemInfo.category;
            }

            if (!serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'serviceType is required (or valid itemId for auto-detection).', {});
            }

            let inventory;

            // Extract pricing overrides and adjustments
            const { totalUnits, status, priceOverride, priceAdjustmentAmount, priceAdjustmentPercent, pricing, note, date } = body;

            // Handle single update from top-level fields (common in form-data)
            if (!updates && date) {
                updates = [{ date, totalUnits, status, priceOverride, priceAdjustmentAmount, priceAdjustmentPercent, pricing, note }];
            }

            const pricingSettings = pricing || {
                basePrice: priceOverride,
                priceAdjustmentAmount: priceAdjustmentAmount ? parseFloat(priceAdjustmentAmount) : null,
                priceAdjustmentPercent: priceAdjustmentPercent ? parseFloat(priceAdjustmentPercent) : null
            };

            // 1. Service/Category-Wide Bulk Update (All items in category)
            if (applyToService === 'true' || applyToService === true) {
                if (!startDate || !endDate) return errorResponse(HTTP_STATUS.BAD_REQUEST, 'startDate and endDate required for service-wide update.', {});
                const settings = { totalUnits, status, pricing: pricingSettings, note };
                inventory = await InventoryService.updateServiceInventoryRange(vendor._id, serviceType, startDate, endDate, settings);
            }
            // 2. Individual Item Range Update
            else if (itemId && startDate && endDate) {
                const settings = { totalUnits, status, pricing: pricingSettings, note };
                inventory = await InventoryService.updateInventoryRange(vendor._id, itemId, serviceType, startDate, endDate, settings);
            }
            // 3. Individual Item Specific Date Array
            else if (itemId && updates && Array.isArray(updates)) {
                inventory = await InventoryService.updateInventory(vendor._id, itemId, serviceType, updates);
            }
            else {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid request format. Provide itemId and updates, or serviceType and range with applyToService=true.', {});
            }

            return successResponse(HTTP_STATUS.OK, 'Inventory updated successfully', inventory);
        } catch (error) {
            console.error('Update Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    /**
     * POST /vendor/inventory/:itemId/initialize
     */
    async initializeInventory(req, { params }) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            const { itemId } = (await params) || {};
            let body;
            if (req.formDataBody) {
                body = parseNestedFormData(req.formDataBody);
            } else {
                body = req.jsonBody || await (req.json().catch(() => ({})));
            }

            let { serviceType, days } = body;

            // Detect serviceType if missing using itemId
            if (itemId && !serviceType) {
                const itemInfo = await PackageService.getAvailablePackageItem(itemId);
                if (itemInfo) serviceType = itemInfo.category;
            }

            if (!itemId || !serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Item ID and serviceType are required', {});
            }

            const inventory = await InventoryService.initializeFromItem(vendor._id, itemId, serviceType, days || 30);
            if (!inventory) return errorResponse(HTTP_STATUS.NOT_FOUND, 'Source item not found in package catalog', {});

            return successResponse(HTTP_STATUS.CREATED, 'Inventory initialized successfully', inventory);
        } catch (error) {
            console.error('Initialize Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    /**
     * PATCH /vendor/inventory/:itemId/baseline
     * Updates the master pricing and availability in the Package catalog.
     */
    async updateItemBaseline(req, { params }) {
        try {
            const user = req.user;
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            const { itemId } = (await params) || {};

            let body;
            if (req.formDataBody) {
                body = parseNestedFormData(req.formDataBody);
            } else {
                body = req.jsonBody || await (req.json().catch(() => ({})));
            }

            let { serviceType, pricing, availability, fleetAvailability } = body;

            // Detect serviceType if missing
            if (itemId && !serviceType) {
                const itemInfo = await PackageService.getAvailablePackageItem(itemId);
                if (itemInfo) serviceType = itemInfo.category;
            }

            if (!itemId || !serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Item ID and serviceType are required', {});
            }

            // Prepare baseline updates
            const updates = {};
            const allowedFields = ['pricing', 'availability', 'fleetAvailability', 'isActive', 'roomDetails', 'details', 'policies', 'timings', 'amenities', 'mealsIncluded', 'mealType'];
            
            allowedFields.forEach(field => {
                if (body[field] !== undefined) {
                    updates[field] = body[field];
                }
            });

            if (Object.keys(updates).length === 0) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'No valid updates provided (pricing, availability, isActive, etc.)', {});
            }

            const updated = await PackageService.updateServiceItem(vendor._id, serviceType, itemId, updates);
            
            return successResponse(HTTP_STATUS.OK, 'Item baseline updated successfully', updated);
        } catch (error) {
            console.error('Update Item Baseline Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const inventoryController = new InventoryController();
export default inventoryController;
