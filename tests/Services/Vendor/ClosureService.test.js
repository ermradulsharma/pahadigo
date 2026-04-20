import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/VendorClosure.js', () => ({
    default: { findOneAndDelete: jest.fn() }
}));
jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: {}
}));

const { default: ClosureService } = await import('@/services/Vendor/ClosureService.js');
const { default: VendorClosure } = await import('@/models/VendorClosure.js');

describe('Industry Standard: ClosureService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should be correctly instantiated by the core container', () => {
        expect(ClosureService).toBeDefined();
    });

    it('[Integrity] should expose standard service interface', () => {
        const exports = typeof ClosureService;
        expect(exports).toBe('object');
    });

    it('[Business Logic] should delete closure period using hard delete for specific user', async () => {
        const userId = 'user123';
        const closureId = 'closure456';
        const mockClosure = { _id: closureId, user: userId };
        
        VendorClosure.findOneAndDelete.mockResolvedValue(mockClosure);

        const result = await ClosureService.deleteClosurePeriod(userId, closureId);
        
        expect(VendorClosure.findOneAndDelete).toHaveBeenCalledWith({
            _id: closureId,
            user: userId
        });
        expect(result).toEqual(mockClosure);
    });
});
