import * as GeneralServices from '@/core/Services/General/index.js';

describe('General Services Index', () => {
    test('should export all general-related services', () => {
        expect(GeneralServices.BookingService).toBeDefined();
        expect(GeneralServices.CategoryService).toBeDefined();
        expect(GeneralServices.InventoryService).toBeDefined();
        expect(GeneralServices.RazorpayService).toBeDefined();
        expect(GeneralServices.NotificationService).toBeDefined();
    });
});

