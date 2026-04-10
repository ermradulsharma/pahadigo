import * as Models from '@/models/index.js';

describe('Models Index', () => {
    test('should export all core models', () => {
        expect(Models.User).toBeDefined();
        expect(Models.Vendor).toBeDefined();
        expect(Models.Booking).toBeDefined();
        expect(Models.Package).toBeDefined();
        expect(Models.Inventory).toBeDefined();
        expect(Models.Category).toBeDefined();
    });
});
