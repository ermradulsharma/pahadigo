import * as TravellerServices from '@/core/Services/Traveller/index.js';

describe('Traveller Services Index', () => {
    test('should export all traveller-related services', () => {
        expect(TravellerServices.BookingService).toBeDefined();
        expect(TravellerServices.InventoryService).toBeDefined();
        expect(TravellerServices.PackageService).toBeDefined();
        expect(TravellerServices.ProfileService).toBeDefined();
        expect(TravellerServices.ReviewService).toBeDefined();
        expect(TravellerServices.SOSService).toBeDefined();
    });
});

