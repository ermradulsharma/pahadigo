import InventoryController from '../../src/core/Http/Controllers/InventoryController.js';
import InventoryService from '../../src/core/Services/InventoryService.js';
import PackageService from '../../src/core/Services/PackageService.js';
import VendorService from '../../src/core/Services/VendorService.js';
import { createMockReq, generateId } from '../helpers/testUtils.js';
import { HTTP_STATUS } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('Inventory API Tests', () => {
    let userId;
    let vendorId;
    let itemId;

    beforeEach(() => {
        userId = generateId().toString();
        vendorId = generateId().toString();
        itemId = generateId().toString();
        jest.clearAllMocks();
    });

    describe('GET /api/vendor/inventory', () => {
        it('should return categorized inventory catalog', async () => {
            const req = createMockReq({ 
                user: { id: userId },
                url: 'http://localhost/api/vendor/inventory'
            });

            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId });
            jest.spyOn(PackageService, 'getVendorInventoryCatalog').mockResolvedValue({ 
                homestay: [{ id: itemId, title: 'Test Homestay' }] 
            });

            const res = await InventoryController.getAllInventory(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const body = await res.json();
            expect(body.data.homestay).toBeDefined();
            expect(body.data.homestay[0].title).toBe('Test Homestay');
        });

        it('should return 404 if vendor not found', async () => {
            const req = createMockReq({ user: { id: userId } });
            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue(null);

            const res = await InventoryController.getAllInventory(req);
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('PATCH /api/vendor/inventory/:itemId/baseline', () => {
        it('should update item baseline successfully', async () => {
            const req = createMockReq({
                user: { id: userId },
                params: Promise.resolve({ itemId }),
                jsonBody: { 
                    serviceType: 'homestay',
                    pricing: { pricePerNight: 5000 },
                    availability: { totalRooms: 10 }
                }
            });

            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId });
            jest.spyOn(PackageService, 'updateServiceItem').mockResolvedValue({ id: itemId });

            const res = await InventoryController.updateItemBaseline(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.updateServiceItem).toHaveBeenCalledWith(
                vendorId, 
                'homestay', 
                itemId, 
                expect.objectContaining({ pricing: { pricePerNight: 5000 } })
            );
        });

        it('should auto-detect serviceType if missing', async () => {
            const req = createMockReq({
                user: { id: userId },
                params: Promise.resolve({ itemId }),
                jsonBody: { pricing: { pricePerNight: 5000 } }
            });

            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue({ category: 'homestay' });
            jest.spyOn(PackageService, 'updateServiceItem').mockResolvedValue({});

            const res = await InventoryController.updateItemBaseline(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.getAvailablePackageItem).toHaveBeenCalledWith(itemId);
        });
    });

    describe('POST /api/vendor/inventory/:itemId/update', () => {
        it('should update specific dates in inventory', async () => {
            const req = createMockReq({
                user: { id: userId },
                params: Promise.resolve({ itemId }),
                jsonBody: { 
                    serviceType: 'homestay',
                    updates: [{ date: '2024-05-10', priceOverride: 6000 }]
                }
            });

            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId });
            jest.spyOn(InventoryService, 'updateInventory').mockResolvedValue({});

            const res = await InventoryController.updateInventory(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(InventoryService.updateInventory).toHaveBeenCalled();
        });
    });

    describe('POST /api/vendor/inventory/:itemId/initialize', () => {
        it('should initialize inventory for an item', async () => {
            const req = createMockReq({
                user: { id: userId },
                params: Promise.resolve({ itemId }),
                jsonBody: { serviceType: 'homestay', days: 60 }
            });

            jest.spyOn(VendorService, 'findByUserId').mockResolvedValue({ _id: vendorId });
            jest.spyOn(InventoryService, 'initializeFromItem').mockResolvedValue({ id: itemId });

            const res = await InventoryController.initializeInventory(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.CREATED);
            expect(InventoryService.initializeFromItem).toHaveBeenCalledWith(vendorId, itemId, 'homestay', 60);
        });
    });
});
