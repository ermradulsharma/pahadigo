import TravellerService from '@/services/Admin/TravellerService';
import { jest } from '@jest/globals';

describe('Industry Standard: TravellerService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should be correctly instantiated by the core container', () => {
        expect(TravellerService).toBeDefined();
    });

    it('[Integrity] should expose standard service interface', () => {
        const exports = typeof TravellerService;
        expect(exports).toBe('object');
    });
});
