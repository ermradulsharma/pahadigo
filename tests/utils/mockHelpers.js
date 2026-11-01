import { jest } from '@jest/globals';

const queryFnNames = [
    'getById', 'getBy', 'getManyBy', 'countBy', 'getUserBy', 'getUserById', 'getUsersBy', 'countUsersBy',
    'getBusinessBy', 'getBusinessById', 'getBusinessByUserId', 'getBusinessByIdAndUserId', 'getVendorsBy',
    'countVendorsBy', 'getVendorDocumentsBy', 'getVendorDocumentById', 'getVendorDocumentBy', 'getVendorClosuresBy',
    'getVendorClosureBy', 'getVendorClosureById', 'getBookingBy', 'getBookingById', 'getBookingsBy', 'countBookingsBy',
    'getPackageBy', 'getPackageById', 'getPackagesBy', 'countPackagesBy', 'getPackageItemById', 'getCategoriesBy',
    'getCategoryBy', 'getCategoryById', 'getCategoryBySlug', 'countCategoriesBy', 'getCategoryDocumentsBy',
    'getCategoryDocumentBy', 'getCategoryDocumentById', 'getReviewsBy', 'getReviewBy', 'getReviewById',
    'countReviewsBy', 'getReviewsByItemId', 'getNotificationBy', 'getNotificationById', 'getNotificationsBy',
    'countNotificationsBy', 'getPolicyBy', 'getPolicyById', 'getPoliciesBy', 'getBlogBy', 'getBlogById', 'getBlogsBy',
    'countBlogsBy', 'getCountryBy', 'getCountryById', 'getCountriesBy', 'getStateBy', 'getStateById', 'getStatesBy',
    'getInventoryBy', 'getInventoryById', 'getInventoriesBy', 'getSettingBy', 'getSettingById', 'getSettingsBy',
    'getDisputeBy', 'getDisputeById', 'getDisputesBy', 'countDisputesBy', 'getDisputeMessageBy', 'getDisputeMessagesBy',
    'getWishlistBy', 'getWishlistById', 'getWishlistsBy', 'getEmergencyAlertBy', 'getEmergencyAlertById',
    'getEmergencyAlertsBy', 'countEmergencyAlertsBy', 'getInquiryBy', 'getInquiryById', 'getInquiriesBy',
    'countInquiriesBy', 'getCouponBy', 'getCouponById', 'getCouponsBy', 'countCouponsBy', 'getConversationBy',
    'getConversationById', 'getConversationsBy', 'countConversationsBy', 'getChatMessageBy', 'getChatMessageById',
    'getChatMessagesBy', 'countChatMessagesBy', 'getWebhookEventBy', 'getWebhookEventById', 'getWebhookEventsBy',
    'getAuditLogBy', 'getAuditLogById', 'getAuditLogsBy', 'countAuditLogsBy', 'getBannerBy', 'getBannerById',
    'getBannersBy', 'countBannersBy', 'getSearchLogBy', 'getSearchLogsBy', 'countSearchLogsBy', 'updateById', 'deleteById'
];

export const createMockQueryHelpers = (overrides = {}) => {
    const helpers = {};
    for (const name of queryFnNames) {
        if (name.startsWith('count')) {
            helpers[name] = jest.fn().mockResolvedValue(0);
        } else if (name.endsWith('sBy') || name.startsWith('getMany')) {
            helpers[name] = jest.fn().mockResolvedValue([]);
        } else {
            helpers[name] = jest.fn().mockResolvedValue(null);
        }
    }
    return Object.assign(helpers, overrides);
};

const modelNames = [
    'AuditLog', 'Banner', 'Blog', 'Booking', 'Category', 'CategoryDocument',
    'ChatMessage', 'Conversation', 'Country', 'Coupon', 'Dispute', 'EmergencyAlert',
    'Inquiry', 'Inventory', 'Message', 'Notification', 'Package', 'Policy',
    'RateLimit', 'Review', 'SearchLog', 'Setting', 'State', 'User',
    'Vendor', 'VendorClosure', 'VendorDocument', 'VerifiedIdentity', 'WebhookEvent', 'Wishlist'
];

export const createMockModels = (overrides = {}) => {
    const models = {};
    for (const name of modelNames) {
        models[name] = {};
    }
    return Object.assign(models, overrides);
};

