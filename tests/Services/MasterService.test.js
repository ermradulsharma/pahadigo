import { jest } from '@jest/globals';

const mockClosureFindOne = jest.fn();

jest.unstable_mockModule('@/core/Models/VendorClosure.js', () => ({
    __esModule: true,
    default: {
        findOne: mockClosureFindOne
    }
}));

const { default: MasterService } = await import('@/core/Services/MasterService.js');

describe('MasterService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isVendorActive', () => {
        it('should return false if vendor is null', async () => {
            const result = await MasterService.isVendorActive(null);
            expect(result).toBe(false);
        });

        it('should return false if vendor basic status is inactive', async () => {
            const vendor = {
                status: 'inactive',
                isOperating: true,
                isApproved: true
            };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('should return true for fully verified active individual vendor', async () => {
            const vendor = {
                _id: 'v1',
                status: 'active',
                isOperating: true,
                isApproved: true,
                profileType: 'individual',
                documents: {
                    panCard: { status: 'verified' },
                    aadharCard: [{ status: 'verified' }]
                }
            };
            mockClosureFindOne.mockResolvedValue(null);

            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(true);
        });

        it('should return false if vendor is currently on vacation (has active closure)', async () => {
            const vendor = {
                _id: 'v1',
                status: 'active',
                isOperating: true,
                isApproved: true,
                profileType: 'individual',
                documents: {
                    panCard: { status: 'verified' },
                    aadharCard: [{ status: 'verified' }]
                }
            };
            mockClosureFindOne.mockResolvedValue({ _id: 'closure1', isActive: true });

            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });
    });

    describe('getVendorActiveAggregationStages', () => {
        it('should generate aggregation stages matching active vendor filter', () => {
            const stages = MasterService.getVendorActiveAggregationStages('vendor');
            expect(stages).toHaveLength(4);
            expect(stages[0].$match['vendor.status']).toBe('active');
        });
    });
});
