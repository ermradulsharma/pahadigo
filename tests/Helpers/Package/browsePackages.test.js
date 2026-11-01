import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { createMockQueryHelpers } from '../../utils/mockHelpers.js';

const mockCategoryFind = jest.fn();
const mockVendorFind = jest.fn();
const mockClosureFind = jest.fn();
const mockVendorDocFind = jest.fn();
const mockPackageAggregate = jest.fn();
const mockGetManyBy = jest.fn().mockResolvedValue([]);

const allQueryHelperExports = createMockQueryHelpers({
    getManyBy: mockGetManyBy,
    getVendorDocumentsBy: mockVendorDocFind,
    getCategoriesBy: mockCategoryFind
});

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => allQueryHelperExports);

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        find: mockCategoryFind
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        find: mockVendorFind
    }
}));

jest.unstable_mockModule('@/core/Models/VendorClosure.js', () => ({
    default: {
        find: mockClosureFind
    }
}));

jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({
    default: {
        find: mockVendorDocFind
    }
}));

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        aggregate: mockPackageAggregate
    }
}));

const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: getBrowsePackages } = await import('@/core/Helpers/Package/browsePackages.js');

describe('Helpers: Package/browsePackages.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return empty result when no approved vendors exist', async () => {
        mockCategoryFind.mockResolvedValue([
            { _id: new mongoose.Types.ObjectId(), name: 'Homestay', slug: 'homestay', isActive: true }
        ]);

        mockVendorFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
            })
        });

        const result = await getBrowsePackages({ format: 'flat', page: 1, limit: 10 });
        expect(result.items).toEqual([]);
        expect(result.pagination.total).toBe(0);
    });

    it('should return empty categorized dictionary when format is grouped and no vendors exist', async () => {
        mockCategoryFind.mockResolvedValue([
            { _id: new mongoose.Types.ObjectId(), name: 'Homestay', slug: 'homestay', isActive: true }
        ]);

        mockVendorFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
            })
        });

        const result = await getBrowsePackages({ format: 'grouped' });
        expect(result).toEqual({});
    });

    it('should query packages and return formatted, paginated items in flat format', async () => {
        const catId = new mongoose.Types.ObjectId();
        const vendorId = new mongoose.Types.ObjectId();

        mockCategoryFind.mockResolvedValue([
            { _id: catId, name: 'Homestay', slug: 'homestay', isActive: true }
        ]);

        mockVendorFind.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                    {
                        _id: vendorId,
                        profileType: 'individual',
                        isApproved: true,
                        isOperating: true,
                        category: [{ slug: 'homestay' }]
                    }
                ])
            })
        });

        mockClosureFind.mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
        });

        mockVendorDocFind.mockResolvedValue([
            { vendor: vendorId, status: 'verified', category_slug: 'homestay', url: 'https://cdn.example.com/pan.pdf', docType: 'pan' },
            { vendor: vendorId, status: 'verified', category_slug: 'homestay', url: 'https://cdn.example.com/aadhaar.pdf', docType: 'aadhaarFront' }
        ]);

        mockGetManyBy.mockImplementation(async (model) => {
            if (model === Vendor) {
                return [
                    {
                        _id: vendorId,
                        profileType: 'individual',
                        isApproved: true,
                        isOperating: true,
                        category: [{ slug: 'homestay' }],
                        address: { location: { coordinates: [77.38, 31.64] } }
                    }
                ];
            }
            return [];
        });

        const mockPackageItem = {
            _id: 'pkg_item_101',
            vendor: vendorId,
            title: 'Deodar Forest Homestay',
            isActive: true,
            category_slug: 'homestay',
            category_name: 'Homestay',
            pricing: { basePrice: 2000, sellingPrice: 2300 },
            location: { address: 'Jibhi, HP', coordinates: [77.38, 31.64] }
        };

        mockPackageAggregate.mockResolvedValueOnce([mockPackageItem]);

        const result = await getBrowsePackages({ format: 'flat', page: 1, limit: 10 });
        expect(result.items).toHaveLength(1);
        expect(result.items[0].title).toBe('Deodar Forest Homestay');
        expect(result.pagination.total).toBe(1);
    });
});
