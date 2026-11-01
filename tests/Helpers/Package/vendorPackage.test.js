import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockGetBusinessByUserId = jest.fn();
const mockGetPackageBy = jest.fn();
const mockGetCategoryBySlug = jest.fn();
const mockPackageAggregate = jest.fn();

const allQueryHelperExports = {
    getById: jest.fn(),
    getBy: jest.fn(),
    getManyBy: jest.fn().mockResolvedValue([]),
    countBy: jest.fn().mockResolvedValue(0),
    getUserBy: jest.fn(),
    getUserById: jest.fn(),
    getUsersBy: jest.fn().mockResolvedValue([]),
    countUsersBy: jest.fn().mockResolvedValue(0),
    getBusinessBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByUserId: mockGetBusinessByUserId,
    getBusinessByIdAndUserId: jest.fn(),
    getVendorsBy: jest.fn().mockResolvedValue([]),
    countVendorsBy: jest.fn().mockResolvedValue(0),
    getVendorDocumentsBy: jest.fn().mockResolvedValue([]),
    getVendorDocumentById: jest.fn(),
    getVendorDocumentBy: jest.fn(),
    getVendorClosuresBy: jest.fn().mockResolvedValue([]),
    getVendorClosureBy: jest.fn(),
    getVendorClosureById: jest.fn(),
    getBookingBy: jest.fn(),
    getBookingById: jest.fn(),
    getBookingsBy: jest.fn().mockResolvedValue([]),
    countBookingsBy: jest.fn().mockResolvedValue(0),
    getPackageBy: mockGetPackageBy,
    getPackageById: jest.fn(),
    getPackagesBy: jest.fn().mockResolvedValue([]),
    countPackagesBy: jest.fn().mockResolvedValue(0),
    getPackageItemById: jest.fn(),
    getCategoriesBy: jest.fn().mockResolvedValue([]),
    getCategoryBy: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryBySlug: mockGetCategoryBySlug,
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
    Wishlist: {},
    AuditLog: {},
    Banner: {},
    Blog: {},
    CategoryDocument: {},
    ChatMessage: {},
    Conversation: {},
    Country: {},
    Coupon: {},
    Dispute: {},
    EmergencyAlert: {},
    Inquiry: {},
    Message: {},
    Notification: {},
    Policy: {},
    RateLimit: {},
    SearchLog: {},
    Setting: {},
    State: {},
    VerifiedIdentity: {},
    WebhookEvent: {}
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
