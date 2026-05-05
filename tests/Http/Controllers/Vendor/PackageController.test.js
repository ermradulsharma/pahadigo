import { jest } from '@jest/globals';
import PackageController from '@/core/Http/Controllers/Vendor/PackageController.js';
import PackageService from '@/core/Services/Vendor/PackageService.js';
import Vendor from '@/core/Models/Vendor.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Vendor PackageController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getPackages', () => {
        test('should return packages for authenticated vendor', async () => {
            const mockVendor = { _id: 'vendor123' };
            const mockPackages = { docs: [], total: 0 };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'vendor' },
                url: 'http://localhost/vendor/packages?page=1&limit=5'
            });

            jest.spyOn(Vendor, 'findOne').mockReturnValue({
                select: jest.fn().mockResolvedValue(mockVendor)
            });
            jest.spyOn(PackageService, 'getPackages').mockResolvedValue(mockPackages);

            const response = await PackageController.getPackages(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockPackages);
        });

        test('should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'user123', role: 'vendor' } });
            jest.spyOn(Vendor, 'findOne').mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const response = await PackageController.getPackages(mockReq);
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('createPackage', () => {
        test('should create package successfully', async () => {
            const mockVendor = { _id: 'vendor123' };
            const mockPkg = { _id: 'pkg123', name: 'Test Pkg' };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'vendor' },
                jsonBody: { name: 'Test Pkg' }
            });
            mockReq.payload = { name: 'Test Pkg' };

            jest.spyOn(Vendor, 'findOne').mockReturnValue({
                select: jest.fn().mockResolvedValue(mockVendor)
            });
            jest.spyOn(PackageService, 'initializeVendorPackage').mockResolvedValue(mockPkg);

            const response = await PackageController.createPackage(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data).toEqual(mockPkg);
        });
    });

    describe('togglePackageStatus', () => {
        test('should toggle package status', async () => {
            const mockVendor = { _id: 'vendor123' };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'vendor' },
                jsonBody: { isActive: true },
                params: { id: 'pkg123' }
            });
            mockReq.payload = { isActive: true };

            jest.spyOn(Vendor, 'findOne').mockReturnValue({
                select: jest.fn().mockResolvedValue(mockVendor)
            });
            const spy = jest.spyOn(PackageService, 'updatePackageStatus').mockResolvedValue({ _id: 'pkg123', isActive: true });

            const response = await PackageController.togglePackageStatus(mockReq, { params: { id: 'pkg123' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(spy).toHaveBeenCalledWith('pkg123', 'user123', 'vendor123', true);
        });
    });
});
