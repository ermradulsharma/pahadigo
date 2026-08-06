import { jest } from '@jest/globals';

jest.unstable_mockModule('@/constants/categories.js', () => ({
    CATEGORY_MAP: { trekking: 'trekking', camping: 'camping' }
}));

jest.unstable_mockModule('@/core/Models/VendorClosure.js', () => ({
    default: {
        findOne: jest.fn()
    }
}));

jest.unstable_mockModule('mongoose', () => ({
    default: {
        model: jest.fn(() => ({
            findOne: jest.fn()
        })),
        models: {},
        Schema: class {
            constructor() {
                this.index = jest.fn();
                this.pre = jest.fn();
            }
            static Types = { ObjectId: jest.fn() };
        }
    }
}));

jest.unstable_mockModule('@/constants/index.js', () => ({
    STATUS: { ACTIVE: 'active', DELETED: 'deleted', BLOCKED: 'blocked', SUSPENDED: 'suspended', INACTIVE: 'inactive', PENDING: 'pending', REJECT: 'reject' },
    VERIFICATION_STATUS: { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected' },
    VENDOR_PROFILE_TYPES: { BUSINESS: 'business', INDIVIDUAL: 'individual' },
    DEFAULTS: { TRUE: true, FALSE: false, NULL: null }
}));

const { default: MasterService } = await import('@/services/MasterService.js');

describe('Industry Standard: MasterService Business Logic', () => {

    describe('[isVendorActive]', () => {
        it('[Success] should return false for null vendor', async () => {
            const result = await MasterService.isVendorActive(null);
            expect(result).toBe(false);
        });

        it('[Failure] should return false if vendor status is not active', async () => {
            const vendor = { status: 'pending', isOperating: true, isApproved: true, documents: {} };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('[Failure] should return false if vendor is not operating', async () => {
            const vendor = { status: 'active', isOperating: false, isApproved: true, documents: {} };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('[Failure] should return false if vendor is not approved', async () => {
            const vendor = { status: 'active', isOperating: true, isApproved: false, documents: {} };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('[Failure] should return false if panCard is not verified', async () => {
            const vendor = {
                status: 'active', isOperating: true, isApproved: true,
                documents: {
                    panCard: { status: 'pending' },
                    aadharCard: [{ status: 'verified' }]
                }
            };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('[Failure] should return false if aadharCard is not verified', async () => {
            const vendor = {
                status: 'active', isOperating: true, isApproved: true,
                documents: {
                    panCard: { status: 'verified' },
                    aadharCard: [{ status: 'pending' }]
                }
            };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });

        it('[Failure] should return false for business vendor without businessRegistration verified', async () => {
            const vendor = {
                status: 'active', isOperating: true, isApproved: true,
                profileType: 'business',
                documents: {
                    panCard: { status: 'verified' },
                    aadharCard: [{ status: 'verified' }],
                    businessRegistration: { status: 'pending' }
                }
            };
            const result = await MasterService.isVendorActive(vendor);
            expect(result).toBe(false);
        });
    });

    describe('[isVendorOperational]', () => {
        it('[Success] should return true when no active closure exists', async () => {
            const { default: VendorClosure } = await import('@/core/Models/VendorClosure.js');
            VendorClosure.findOne.mockResolvedValue(null);
            const result = await MasterService.isVendorOperational('vendor123');
            expect(result).toBe(true);
        });

        it('[Failure] should return false when an active closure exists', async () => {
            const { default: VendorClosure } = await import('@/core/Models/VendorClosure.js');
            VendorClosure.findOne.mockResolvedValue({ _id: 'closure1' });
            const result = await MasterService.isVendorOperational('vendor123');
            expect(result).toBe(false);
        });
    });

    describe('[getVendorActiveAggregationStages]', () => {
        it('[Success] should return an array of aggregation stages', () => {
            const stages = MasterService.getVendorActiveAggregationStages();
            expect(Array.isArray(stages)).toBe(true);
            expect(stages.length).toBeGreaterThan(0);
        });

        it('[Success] should use custom vendor profile field', () => {
            const stages = MasterService.getVendorActiveAggregationStages('vendor');
            const firstMatch = stages[0];
            // MongoDB query uses dot-string keys; check the object directly
            expect(firstMatch.$match['vendor.status']).toBe('active');
        });
    });

    describe('[getCategoryVerificationStages]', () => {
        it('[Success] should return lookup and match stages', () => {
            const stages = MasterService.getCategoryVerificationStages();
            expect(Array.isArray(stages)).toBe(true);
            const hasLookup = stages.some(s => s.$lookup);
            const hasMatch = stages.some(s => s.$match);
            expect(hasLookup).toBe(true);
            expect(hasMatch).toBe(true);
        });
    });
});
