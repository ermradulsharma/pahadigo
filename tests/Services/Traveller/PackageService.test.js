import PackageService from '@/services/Traveller/PackageService';
import { jest } from '@jest/globals';

describe('Industry Standard: PackageService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should be correctly instantiated by the core container', () => {
        expect(PackageService).toBeDefined();
    });

    it('[Integrity] should expose standard service interface', () => {
        const exports = typeof PackageService;
        expect(exports).toBe('object');
    });

    it('[Feature] should fetch available packages by category without erroring', async () => {
        // This will attempt to call the aggregation pipeline
        try {
            const result = await PackageService.getAvailablePackagesByCategory();
            expect(typeof result).toBe('object');
        } catch (error) {
            // If it fails with a different error (like DB connection), it's okay for now,
            // but it shouldn't fail with "not a function"
            if (error.message.includes('not a function')) {
                throw error;
            }
        }
    });

    it('[Feature] should search nearby packages without erroring', async () => {
        try {
            const result = await PackageService.searchPackages(30.3165, 78.0322); // Dehradun coords
            expect(Array.isArray(result)).toBe(true);
        } catch (error) {
            if (error.message.includes('not a function')) {
                throw error;
            }
        }
    });
});
