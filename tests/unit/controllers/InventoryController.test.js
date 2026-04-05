import InventoryController from '../../../src/core/Http/Controllers/InventoryController.js';
import InventoryService from '../../../src/core/Services/InventoryService.js';
import PackageService from '../../../src/core/Services/PackageService.js';
import VendorService from '../../../src/core/Services/VendorService.js';
import { createMockReq, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('InventoryController Test Suite', () => {
    let mockVendor;
    let userId;
    let vendorId;
    let itemId;

    beforeEach(() => {
        jest.clearAllMocks();
        userId = generateId().toString();
        vendorId = generateId().toString();
        itemId = generateId().toString();
        mockVendor = { _id: vendorId, user: userId };
        
        // Default Mocking Service calls
        jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(mockVendor);
    });

    describe('getAllInventory', () => {
        it('should return categorized inventory catalog', async () => {
            const req = createMockReq({ user: { id: userId } });
            jest.spyOn(PackageService, 'getVendorInventoryCatalog').mockResolvedValue({ 
                homestay: [{ id: itemId, title: 'Test' }] 
            });

            const res = await InventoryController.getAllInventory(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            const body = await res.json();
            expect(body.data.homestay).toBeDefined();
        });

        it('should return 404 if vendor not found', async () => {
            const req = createMockReq({ user: { id: userId } });
            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);
            const res = await InventoryController.getAllInventory(req);
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('updateItemBaseline', () => {
        it('should update pricing and availability successfully', async () => {
            const updates = { 
                pricing: { pricePerNight: 500 },
                availability: { totalRooms: 10 },
                isActive: false
            };
            const req = createMockReq({ jsonBody: { ...updates, serviceType: 'hotel' }, params: { itemId } });
            const mockUpdatedItem = { id: itemId, ...updates };
            const updateSpy = jest.spyOn(PackageService, 'updateServiceItem').mockResolvedValue(mockUpdatedItem);

            const response = await InventoryController.updateItemBaseline(req, { params: req.params });
            const responseData = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(updateSpy).toHaveBeenCalledWith(vendorId, 'hotel', itemId, updates);
        });

        it('should auto-detect serviceType if missing', async () => {
            const updates = { pricing: { pricePerNight: 500 } };
            const req = createMockReq({ jsonBody: updates, params: { itemId } });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue({ category: 'homestay' });
            const updateSpy = jest.spyOn(PackageService, 'updateServiceItem').mockResolvedValue({ id: itemId });

            await InventoryController.updateItemBaseline(req, { params: req.params });
            expect(updateSpy).toHaveBeenCalledWith(vendorId, 'homestay', itemId, updates);
        });
    });

    describe('updateInventory (specific dates)', () => {
        it('should update specific dates via InventoryService', async () => {
            const req = createMockReq({
                params: { itemId },
                jsonBody: { serviceType: 'homestay', updates: [{ date: '2024-05-10', priceOverride: 6000 }] }
            });
            const updateSpy = jest.spyOn(InventoryService, 'updateInventory').mockResolvedValue({});
            const res = await InventoryController.updateInventory(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(updateSpy).toHaveBeenCalled();
        });
    });

    describe('initializeInventory', () => {
        it('should initialize inventory via InventoryService', async () => {
            const req = createMockReq({ params: { itemId }, jsonBody: { serviceType: 'homestay', days: 60 } });
            const initSpy = jest.spyOn(InventoryService, 'initializeFromItem').mockResolvedValue({ id: itemId });
            const res = await InventoryController.initializeInventory(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            expect(initSpy).toHaveBeenCalledWith(vendorId, itemId, 'homestay', 60);
        });
    });
});
