import { jest } from '@jest/globals';

const createQueryMock = (val) => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(val)
});

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        findById: jest.fn(() => createQueryMock({ vendor: { _id: 'v1' } })),
        findOne: jest.fn(() => createQueryMock({ _id: 'item1', catalogId: 'p123', category: 'trekking', isActive: true })),
        find: jest.fn(() => createQueryMock([])),
        aggregate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        aggregate: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        find: jest.fn(() => createQueryMock([{ slug: 'trekking', name: 'Trekking' }]))
    }
}));

jest.unstable_mockModule('@/core/Services/MasterService.js', () => ({
    default: {
        isVendorActive: jest.fn(() => Promise.resolve(true)),
        getVendorActiveAggregationStages: jest.fn(() => []),
        getCategoryVerificationStages: jest.fn(() => [])
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({ tax: { gst: 18, service_tax: 2 } })
}));

const { default: PackageService } = await import('@/core/Services/General/PackageService.js');
const { default: Package } = await import('@/core/Models/Package.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');

describe('Industry Standard: General PackageService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Availability] should verify vendor and category compliance for public items', async () => {
        Package.findOne.mockReturnValue(createQueryMock({
            _id: 'item1', catalogId: 'p123', category: 'trekking', isActive: true, pricing: {}
        }));
        
        Package.findById.mockReturnValue(createQueryMock({
            _id: 'p123',
            vendor: { _id: 'v1' }
        }));

        const result = await PackageService.getAvailablePackageItem('item1');
        expect(result).toBeDefined();
    });

    it('[Search] should execute complex aggregation for available packages', async () => {
        Package.aggregate.mockResolvedValue([{ _id: 'item1', title: 'Adventure' }]);
        
        const results = await PackageService.getAvailablePackages('trekking');

        expect(Package.aggregate).toHaveBeenCalled();
        expect(results).toHaveLength(1);
    });

    it('[Geo] should execute proximity search when coordinates are provided', async () => {
        Vendor.aggregate.mockResolvedValue([{ _id: 'itemG', distance: 100 }]);

        const results = await PackageService.searchPackages(30.3, 78.0, 'trekking', 50);

        expect(Vendor.aggregate).toHaveBeenCalled();
        expect(results[0].distance).toBe(100);
    });
});
