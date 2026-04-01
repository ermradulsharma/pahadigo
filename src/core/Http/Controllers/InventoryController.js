import InventoryService from '@/services/InventoryService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class InventoryController {
    /**
     * GET /vendor/inventory/:itemId?serviceType=trekking&startDate=...&endDate=...
     */
    async getItemInventory(req, { params }) {
        try {
            const user = req.user;
            const { itemId } = params;
            
            const url = new URL(req.url);
            const serviceType = url.searchParams.get('serviceType');
            const startDate = url.searchParams.get('startDate') || new Date().toISOString();
            const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            if (!itemId || !serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Item ID and serviceType are required', {});
            }

            const inventory = await InventoryService.getItemInventory(user.id, itemId, serviceType, startDate, endDate);
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
            const { serviceType } = params;
            
            const url = new URL(req.url);
            const startDate = url.searchParams.get('startDate') || new Date().toISOString();
            const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            if (!serviceType) return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Service type is required', {});

            const inventory = await InventoryService.getServiceInventory(user.id, serviceType, startDate, endDate);
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
            const { itemId } = params;
            const body = req.jsonBody || await req.json();

            const { serviceType, startDate, endDate, updates, applyToService } = body;

            if (!serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'serviceType is required.', {});
            }

            let inventory;

            // Extract pricing overrides and adjustments
            const { totalUnits, status, priceOverride, priceAdjustmentAmount, priceAdjustmentPercent, pricing, note } = body;
            const pricingSettings = pricing || { 
                basePrice: priceOverride, 
                priceAdjustmentAmount: priceAdjustmentAmount ? parseFloat(priceAdjustmentAmount) : null,
                priceAdjustmentPercent: priceAdjustmentPercent ? parseFloat(priceAdjustmentPercent) : null
            };

            // 1. Service/Category-Wide Bulk Update (All items in category)
            if (applyToService === 'true' || applyToService === true) {
                if (!startDate || !endDate) return errorResponse(HTTP_STATUS.BAD_REQUEST, 'startDate and endDate required for service-wide update.', {});
                const settings = { totalUnits, status, pricing: pricingSettings, note };
                inventory = await InventoryService.updateServiceInventoryRange(user.id, serviceType, startDate, endDate, settings);
            }
            // 2. Individual Item Range Update
            else if (itemId && startDate && endDate) {
                const settings = { totalUnits, status, pricing: pricingSettings, note };
                inventory = await InventoryService.updateInventoryRange(user.id, itemId, serviceType, startDate, endDate, settings);
            } 
            // 3. Individual Item Specific Date Array
            else if (itemId && updates && Array.isArray(updates)) {
                inventory = await InventoryService.updateInventory(user.id, itemId, serviceType, updates);
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
            const { itemId } = params;
            const body = req.jsonBody || await req.json();
            const { serviceType, days } = body;

            if (!itemId || !serviceType) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Item ID and serviceType are required', {});
            }

            const inventory = await InventoryService.initializeFromPackage(user.id, itemId, serviceType, days || 30);
            if (!inventory) return errorResponse(HTTP_STATUS.NOT_FOUND, 'Source item not found in package catalog', {});

            return successResponse(HTTP_STATUS.CREATED, 'Inventory initialized successfully', inventory);
        } catch (error) {
            console.error('Initialize Inventory Error:', error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const inventoryController = new InventoryController();
export default inventoryController;

