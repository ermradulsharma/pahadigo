import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Vendor/InventoryService.js', () => ({
    default: {
        getCategoryInventory: jest.fn(),
        updateServiceInventoryRange: jest.fn(),
        updateInventoryRange: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Vendor/PackageService.js', () => ({
    default: {
        getInventory: jest.fn(),
        getPackageItem: jest.fn(),
        updateServiceItem: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessByUserId: jest.fn()
    }
}));

const { default: InventoryController } = await import('@/core/Http/Controllers/Vendor/InventoryController.js');
const { default: InventoryService } = await import('@/core/Services/Vendor/InventoryService.js');
const { default: PackageService } = await import('@/core/Services/Vendor/PackageService.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Vendor InventoryController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NEXT_PUBLIC_APP_URL = 'http://localhost';
    });

    describe('getInventory', () => {
        it('should fetch full inventory catalog successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            PackageService.getInventory.mockResolvedValue({ hotel: [] });

            const response = await InventoryController.getInventory(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual({ hotel: [] });
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockRejectedValue(new Error('err'));
            const response = await InventoryController.getInventory(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });

        it('should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue(null);
            const response = await InventoryController.getInventory(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('getInventoryItem', () => {
        it('should fetch specific inventory item', async () => {
            mockReq = createMockReq({ user: { id: 'u1' }, url: 'http://localhost/api?itemId=1&serviceType=hotel' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            InventoryService.getCategoryInventory.mockResolvedValue([]);

            const response = await InventoryController.getInventoryItem(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(InventoryService.getCategoryInventory).toHaveBeenCalledWith('v1', 'hotel', expect.any(String), expect.any(String), '1');
        });

        it('should auto-detect service type if missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' }, url: 'http://localhost/api?itemId=1' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            PackageService.getPackageItem.mockResolvedValue({ category: 'hotel' });
            InventoryService.getCategoryInventory.mockResolvedValue([]);

            const response = await InventoryController.getInventoryItem(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.getPackageItem).toHaveBeenCalledWith('1');
        });

        it('should return 400 if service type cannot be determined', async () => {
            mockReq = createMockReq({ user: { id: 'u1' }, url: 'http://localhost/api' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            const response = await InventoryController.getInventoryItem(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' }, url: 'http://localhost/api' });
            BusinessService.getBusinessByUserId.mockResolvedValue(null);
            const response = await InventoryController.getInventoryItem(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('updateInventory', () => {
        it('should update specific item inventory', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { itemId: '1', serviceType: 'hotel', startDate: '2026-06-01' };
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            InventoryService.updateInventoryRange.mockResolvedValue({});

            const response = await InventoryController.updateInventory(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(InventoryService.updateInventoryRange).toHaveBeenCalled();
        });

        it('should update service wide inventory if applyToService is true', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { itemId: '1', serviceType: 'hotel', applyToService: true };
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            InventoryService.updateServiceInventoryRange.mockResolvedValue({});

            const response = await InventoryController.updateInventory(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(InventoryService.updateServiceInventoryRange).toHaveBeenCalled();
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = {};
            BusinessService.getBusinessByUserId.mockRejectedValue(new Error('err'));
            const response = await InventoryController.updateInventory(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });

        it('should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue(null);
            const response = await InventoryController.updateInventory(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('updateBasePrice', () => {
        it('should update baseline price successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { itemId: '1', updates: { basePrice: 500 } };
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            PackageService.getPackageItem.mockResolvedValue({ category: 'hotel' });
            PackageService.updateServiceItem.mockResolvedValue({});

            const response = await InventoryController.updateBasePrice(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(PackageService.updateServiceItem).toHaveBeenCalledWith('u1', 'v1', 'hotel', '1', { basePrice: 500 });
        });

        it('should return 400 if itemId is missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = {};
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            const response = await InventoryController.updateBasePrice(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should return 404 if item not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { itemId: '1' };
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            PackageService.getPackageItem.mockResolvedValue(null);
            const response = await InventoryController.updateBasePrice(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockRejectedValue(new Error('err'));
            const response = await InventoryController.updateBasePrice(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });

        it('should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue(null);
            const response = await InventoryController.updateBasePrice(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });
});
