import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockCategoryFind = jest.fn();
const mockVendorFind = jest.fn();
const mockClosureFind = jest.fn();
const mockVendorDocFind = jest.fn();
const mockPackageAggregate = jest.fn();
const mockGetManyBy = jest.fn().mockResolvedValue([]);

const allQueryHelperExports = {
    getById: jest.fn(),
    getBy: jest.fn(),
    getManyBy: mockGetManyBy,
    countBy: jest.fn().mockResolvedValue(0),
    getUserBy: jest.fn(),
    getUserById: jest.fn(),
    getUsersBy: jest.fn().mockResolvedValue([]),
    countUsersBy: jest.fn().mockResolvedValue(0),
    getBusinessBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByUserId: jest.fn(),
    getBusinessByIdAndUserId: jest.fn(),
    getVendorsBy: jest.fn().mockResolvedValue([]),
    countVendorsBy: jest.fn().mockResolvedValue(0),
    getVendorDocumentsBy: mockVendorDocFind,
    getVendorDocumentById: jest.fn(),
    getVendorDocumentBy: jest.fn(),
    getVendorClosuresBy: jest.fn().mockResolvedValue([]),
    getVendorClosureBy: jest.fn(),
    getVendorClosureById: jest.fn(),
    getBookingBy: jest.fn(),
    getBookingById: jest.fn(),
    getBookingsBy: jest.fn().mockResolvedValue([]),
    countBookingsBy: jest.fn().mockResolvedValue(0),
    getPackageBy: jest.fn(),
    getPackageById: jest.fn(),
    getPackagesBy: jest.fn().mockResolvedValue([]),
    countPackagesBy: jest.fn().mockResolvedValue(0),
    getPackageItemById: jest.fn(),
    getCategoriesBy: mockCategoryFind,
    getCategoryBy: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryBySlug: jest.fn(),
    countCategoriesBy: jest.fn().mockResolvedValue(0),
    getCategoryDocumentsBy: jest.fn().mockResolvedValue([]),
    getCategoryDocumentBy: jest.fn(),
    getCategoryDocumentById: jest.fn(),
    getReviewsBy: jest.fn().mockResolvedValue([]),
    getReviewBy: jest.fn(),
    getReviewById: jest.fn(),
    countReviewsBy: jest.fn().mockResolvedValue(0),
    getReviewsByItemId: jest.fn().mockResolvedValue([]),
    getNotificationBy: jest.fn(),
    getNotificationById: jest.fn(),
    getNotificationsBy: jest.fn().mockResolvedValue([]),
    countNotificationsBy: jest.fn().mockResolvedValue(0),
    getPolicyBy: jest.fn(),
    getPolicyById: jest.fn(),
    getPoliciesBy: jest.fn().mockResolvedValue([]),
    getBlogBy: jest.fn(),
    getBlogById: jest.fn(),
    getBlogsBy: jest.fn().mockResolvedValue([]),
    countBlogsBy: jest.fn().mockResolvedValue(0),
    getCountryBy: jest.fn(),
    getCountryById: jest.fn(),
    getCountriesBy: jest.fn().mockResolvedValue([]),
    getStateBy: jest.fn(),
    getStateById: jest.fn(),
    getStatesBy: jest.fn().mockResolvedValue([]),
    getInventoryBy: jest.fn(),
    getInventoryById: jest.fn(),
    getInventoriesBy: jest.fn().mockResolvedValue([]),
    getSettingBy: jest.fn(),
    getSettingById: jest.fn(),
    getSettingsBy: jest.fn().mockResolvedValue([]),
    getDisputeBy: jest.fn(),
    getDisputeById: jest.fn(),
    getDisputesBy: jest.fn().mockResolvedValue([]),
    countDisputesBy: jest.fn().mockResolvedValue(0),
    getDisputeMessageBy: jest.fn(),
    getDisputeMessagesBy: jest.fn().mockResolvedValue([]),
    getWishlistBy: jest.fn(),
    getWishlistById: jest.fn(),
    getWishlistsBy: jest.fn().mockResolvedValue([]),
    getEmergencyAlertBy: jest.fn(),
    getEmergencyAlertById: jest.fn(),
    getEmergencyAlertsBy: jest.fn().mockResolvedValue([]),
    countEmergencyAlertsBy: jest.fn().mockResolvedValue(0),
    getInquiryBy: jest.fn(),
    getInquiryById: jest.fn(),
    getInquiriesBy: jest.fn().mockResolvedValue([]),
    countInquiriesBy: jest.fn().mockResolvedValue(0),
    getCouponBy: jest.fn(),
    getCouponById: jest.fn(),
    getCouponsBy: jest.fn().mockResolvedValue([]),
    countCouponsBy: jest.fn().mockResolvedValue(0),
    getConversationBy: jest.fn(),
    getConversationById: jest.fn(),
    getConversationsBy: jest.fn().mockResolvedValue([]),
    countConversationsBy: jest.fn().mockResolvedValue(0),
    getChatMessageBy: jest.fn(),
    getChatMessageById: jest.fn(),
    getChatMessagesBy: jest.fn().mockResolvedValue([]),
    countChatMessagesBy: jest.fn().mockResolvedValue(0),
    getWebhookEventBy: jest.fn(),
    getWebhookEventById: jest.fn(),
    getWebhookEventsBy: jest.fn().mockResolvedValue([]),
    getAuditLogBy: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogsBy: jest.fn().mockResolvedValue([]),
    countAuditLogsBy: jest.fn().mockResolvedValue(0),
    getBannerBy: jest.fn(),
    getBannerById: jest.fn(),
    getBannersBy: jest.fn().mockResolvedValue([]),
    countBannersBy: jest.fn().mockResolvedValue(0),
    getSearchLogBy: jest.fn(),
    getSearchLogsBy: jest.fn().mockResolvedValue([]),
    countSearchLogsBy: jest.fn().mockResolvedValue(0),
    updateById: jest.fn(),
    deleteById: jest.fn()
};

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
