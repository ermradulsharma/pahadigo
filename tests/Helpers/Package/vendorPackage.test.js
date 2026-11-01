import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockGetBusinessByUserId = jest.fn();
const mockGetPackageBy = jest.fn();
const mockGetCategoryBySlug = jest.fn();
const mockPackageAggregate = jest.fn();

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getById: jest.fn(),
    getBy: jest.fn(),
    getManyBy: jest.fn().mockResolvedValue([]),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    getUserBy: jest.fn(),
    getUserById: jest.fn(),
    getUsersBy: jest.fn(),
    getBusinessBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByUserId: mockGetBusinessByUserId,
    getBusinessByIdAndUserId: jest.fn(),
    getVendorsBy: jest.fn(),
    getVendorDocumentsBy: jest.fn().mockResolvedValue([]),
    getBookingBy: jest.fn(),
    getBookingById: jest.fn(),
    getBookingsBy: jest.fn(),
    getPackageBy: mockGetPackageBy,
    getPackageById: jest.fn(),
    getPackagesBy: jest.fn(),
    getPackageItemById: jest.fn(),
    getCategoryBy: jest.fn(),
    getCategoriesBy: jest.fn().mockResolvedValue([]),
    getCategoryById: jest.fn(),
    getCategoryBySlug: mockGetCategoryBySlug,
    getReviewsBy: jest.fn().mockResolvedValue([]),
    getReviewsByItemId: jest.fn().mockResolvedValue([]),
    getNotificationBy: jest.fn(),
    getNotificationById: jest.fn(),
    getNotificationsBy: jest.fn().mockResolvedValue([])
}));

jest.unstable_mockModule('@/core/Models/index.js', () => ({
    Package: { aggregate: mockPackageAggregate },
    Inventory: {},
    User: {},
    Vendor: {},
    Category: {},
    Review: {},
    Booking: {},
    VendorDocument: {},
    VendorClosure: {},
    Wishlist: {}
}));

const { getVendorPackages, getVendorPackageItemById } = await import('@/core/Helpers/Package/vendorPackage.js');

describe('Helpers: Package/vendorPackage.js', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getVendorPackages', () => {
        it('should return empty result when vendor profile does not exist', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            mockGetBusinessByUserId.mockResolvedValue(null);

            const flatRes = await getVendorPackages({ userId, format: 'flat', page: 1, limit: 10 });
            expect(flatRes.items).toEqual([]);
            expect(flatRes.pagination.total).toBe(0);

            const groupedRes = await getVendorPackages({ userId, format: 'grouped' });
            expect(groupedRes).toEqual({});
        });

        it('should return empty result when vendor has no package catalog created', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const vendorId = new mongoose.Types.ObjectId();

            mockGetBusinessByUserId.mockResolvedValue({
                _id: vendorId,
                category: [{ name: 'Homestay', slug: 'homestay', _id: new mongoose.Types.ObjectId() }]
            });
            mockGetPackageBy.mockResolvedValue(null);

            const result = await getVendorPackages({ userId, format: 'flat', page: 1, limit: 10 });
            expect(result.items).toEqual([]);
            expect(result.pagination.total).toBe(0);
        });

        it('should retrieve, filter, and paginate vendor package items in flat format', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const vendorId = new mongoose.Types.ObjectId();
            const catId = new mongoose.Types.ObjectId();

            mockGetBusinessByUserId.mockResolvedValue({
                _id: vendorId,
                category: [{ name: 'Homestay', slug: 'homestay', _id: catId }]
            });

            const mockHomestayItem = {
                _id: 'hs_item_1',
                title: 'Himalayan Pine Homestay',
                isActive: true,
                pricing: { basePrice: 2000, sellingPrice: 2200 },
                location: { address: 'Kasol, HP', coordinates: [77.31, 32.01] }
            };

            mockGetPackageBy.mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                vendor: vendorId,
                homestay: [mockHomestayItem]
            });

            const result = await getVendorPackages({ userId, format: 'flat', page: 1, limit: 10 });

            expect(result.items).toHaveLength(1);
            expect(result.items[0].title).toBe('Himalayan Pine Homestay');
            expect(result.pagination.total).toBe(1);
        });

        it('should group items by category when format is grouped', async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const vendorId = new mongoose.Types.ObjectId();
            const catId = new mongoose.Types.ObjectId();

            mockGetBusinessByUserId.mockResolvedValue({
                _id: vendorId,
                category: [{ name: 'Homestay', slug: 'homestay', _id: catId }]
            });

            const mockHomestayItem = {
                _id: 'hs_item_2',
                title: 'Valley View Homestay',
                isActive: true,
                pricing: { basePrice: 1800, sellingPrice: 1950 }
            };

            mockGetPackageBy.mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                vendor: vendorId,
                homestay: [mockHomestayItem]
            });

            const result = await getVendorPackages({ userId, format: 'grouped', page: 1, limit: 10 });

            expect(result.homestay).toBeDefined();
            expect(result.homestay.items).toHaveLength(1);
            expect(result.homestay.items[0].title).toBe('Valley View Homestay');
        });
    });

    describe('getVendorPackageItemById', () => {
        it('should return null when vendor is not found', async () => {
            mockGetBusinessByUserId.mockResolvedValue(null);
            const result = await getVendorPackageItemById('user_123', 'item_123');
            expect(result).toBeNull();
        });

        it('should return null when itemId is missing or category is unmapped', async () => {
            const vendorId = new mongoose.Types.ObjectId();
            mockGetBusinessByUserId.mockResolvedValue({
                _id: vendorId,
                category: []
            });

            const result = await getVendorPackageItemById('user_123', null);
            expect(result).toBeNull();
        });
    });
});
