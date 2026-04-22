import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        findById: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
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
        find: jest.fn(() => ({ lean: jest.fn().mockResolvedValue([{ slug: 'trekking', name: 'Trekking' }]) }))
    }
}));

jest.unstable_mockModule('@/services/MasterService.js', () => ({
    default: {
        isVendorActive: jest.fn(() => Promise.resolve(true)),
        getVendorActiveAggregationStages: jest.fn(() => []),
        getCategoryVerificationStages: jest.fn(() => [])
    }
}));

// Mock VendorDocument for getAvailablePackageItem
jest.unstable_mockModule('mongoose', () => {
    const mockMongoose = {
        Types: { ObjectId: jest.fn(id => id) },
        model: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue({ status: 'verified' })
        }))
    };
    return {
        default: mockMongoose,
        __esModule: true,
        ...mockMongoose
    }
});

const { default: PackageService } = await import('@/services/General/PackageService.js');
const { default: Package } = await import('@/core/Models/Package.js');

describe('Industry Standard: General PackageService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Detail] should retrieve a specific package item by its internal ID', async () => {
        const mockPackage = {
            _id: 'p123',
            trekking: [{ _id: 'item1', title: 'Everest Base' }]
        };
        Package.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockPackage) });

        const result = await PackageService.getPackageItem('item1');

        expect(result.title).toBe('Everest Base');
        expect(result.catalogId).toBe('p123');
    });

    it('[Availability] should verify vendor and category compliance for public items', async () => {
        // Mock getPackageItem internal call
        jest.spyOn(PackageService, 'getPackageItem').mockResolvedValue({
            _id: 'item1', catalogId: 'p123', category: 'trekking', isActive: true
        });
        
        Package.findById.mockReturnValue({ populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue({ vendor: { _id: 'v1' } }) });

        const result = await PackageService.getAvailablePackageItem('item1');

        expect(result).not.toBeNull();
        expect(result._id).toBe('item1');
    });

    it('[Search] should execute complex aggregation for available packages', async () => {
        Package.aggregate.mockResolvedValue([{ _id: 'item1', title: 'Adventure' }]);
        
        const results = await PackageService.getAvailablePackages('trekking');

        expect(Package.aggregate).toHaveBeenCalled();
        expect(results).toHaveLength(1);
    });

    it('[Geo] should execute proximity search when coordinates are provided', async () => {
        const { default: Vendor } = await import('@/core/Models/Vendor.js');
        Vendor.aggregate.mockResolvedValue([{ _id: 'itemG', distance: 100 }]);

        const results = await PackageService.searchPackages(30.3, 78.0, 'trekking', 50);

        expect(Vendor.aggregate).toHaveBeenCalled();
        expect(results[0].distance).toBe(100);
    });
});
