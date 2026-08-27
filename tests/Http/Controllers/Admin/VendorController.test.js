import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Admin/VendorService.js', () => ({
    __esModule: true,
    default: {
        getAllVendors: jest.fn(),
        getVendorById: jest.fn(),
        createVendor: jest.fn(),
        updateVendor: jest.fn(),
        deleteVendor: jest.fn(),
        updateVendorStatus: jest.fn(),
        verifyDocumentOCR: jest.fn(),
        verifyManualDocument: jest.fn(),
        verifyCategoryDocument: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Admin/PackageService.js', () => ({
    __esModule: true,
    default: {
        getVendorPackages: jest.fn()
    }
}));

const { default: VendorController } = await import('@/core/Http/Controllers/Admin/VendorController.js');
const { default: VendorService } = await import('@/core/Services/Admin/VendorService.js');
const { default: PackageService } = await import('@/core/Services/Admin/PackageService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Admin VendorController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getVendors', () => {
        it('should return list of all vendors', async () => {
            mockReq = createMockReq({ user: { role: 'admin' } });
            VendorService.getAllVendors.mockResolvedValue([{ _id: 'v1', businessName: 'Hotel Sunrise' }]);

            const response = await VendorController.getVendors(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toHaveLength(1);
        });
    });

    describe('getVendorById', () => {
        it('should return vendor profile details by ID', async () => {
            mockReq = createMockReq({ user: { role: 'admin' } });
            VendorService.getVendorById.mockResolvedValue({ _id: 'v1', businessName: 'Hotel Sunrise' });

            const response = await VendorController.getVendorById(mockReq, { params: { id: 'v1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data._id).toBe('v1');
        });
    });

    describe('getVendorPackages', () => {
        it('should return packages registered for vendor', async () => {
            mockReq = createMockReq({ user: { role: 'admin' } });
            PackageService.getVendorPackages.mockResolvedValue([{ _id: 'p1', title: 'Luxury Suite' }]);

            const response = await VendorController.getVendorPackages(mockReq, { params: { id: 'v1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.packages).toHaveLength(1);
        });
    });

    describe('deleteVendor', () => {
        it('should soft delete vendor profile', async () => {
            mockReq = createMockReq({ user: { role: 'admin' } });
            VendorService.deleteVendor.mockResolvedValue(true);

            const response = await VendorController.deleteVendor(mockReq, { params: { id: 'v1' } });

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(VendorService.deleteVendor).toHaveBeenCalledWith('v1');
        });
    });
});
