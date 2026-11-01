import * as AdminServices from '@/core/Services/Admin/index.js';

describe('Admin Services Index', () => {
    test('should export all admin-related services', () => {
        expect(AdminServices.AuditService).toBeDefined();
        expect(AdminServices.BookingService).toBeDefined();
        expect(AdminServices.CategoryDocumentService).toBeDefined();
        expect(AdminServices.CategoryService).toBeDefined();
        expect(AdminServices.DashboardService).toBeDefined();
        expect(AdminServices.LocationService).toBeDefined();
        expect(AdminServices.MarketingService).toBeDefined();
        expect(AdminServices.OCRService).toBeDefined();
        expect(AdminServices.PackageService).toBeDefined();
        expect(AdminServices.PolicyService).toBeDefined();
        expect(AdminServices.ReviewService).toBeDefined();
        expect(AdminServices.SettingsService).toBeDefined();
        expect(AdminServices.TravellerService).toBeDefined();
        expect(AdminServices.VendorService).toBeDefined();
    });
});

