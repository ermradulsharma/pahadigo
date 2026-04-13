import * as VendorServices from '@/services/Vendor/index.js';

describe('Vendor Services Index', () => {
    test('should export all vendor-related services', () => {
        expect(VendorServices.PackageService).toBeDefined();
        expect(VendorServices.InventoryService).toBeDefined();
        expect(VendorServices.BusinessService).toBeDefined();
        expect(VendorServices.BankService).toBeDefined();
        expect(VendorServices.CategoryService).toBeDefined();
        expect(VendorServices.ClosureService).toBeDefined();
        expect(VendorServices.DocumentService).toBeDefined();
    });
});
