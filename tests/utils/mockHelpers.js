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

/**
 * Creates a fluent chainable Mongoose Query mock.
 */
const createFluentQuery = (resolvedValue = null) => {
    let currentVal = resolvedValue;
    const query = {
        _setResolvedValue(val) { currentVal = val; return query; },
        session: jest.fn().mockReturnThis(),
        lean: jest.fn().mockImplementation(() => Promise.resolve(currentVal)),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() => Promise.resolve(currentVal)),
        then: jest.fn((onResolve, onReject) => Promise.resolve(currentVal).then(onResolve, onReject)),
        catch: jest.fn((onReject) => Promise.resolve(currentVal).catch(onReject))
    };
    return query;
};

/**
 * Creates a dynamic mock Mongoose Model with chainable query methods.
 */
export const createDynamicModel = (overrides = {}) => {
    const baseModel = {
        find: jest.fn(() => createFluentQuery([])),
        findOne: jest.fn(() => createFluentQuery(null)),
        findById: jest.fn(() => createFluentQuery(null)),
        findByIdAndUpdate: jest.fn(() => createFluentQuery(null)),
        findOneAndUpdate: jest.fn(() => createFluentQuery(null)),
        findByIdAndDelete: jest.fn(() => createFluentQuery(null)),
        findOneAndDelete: jest.fn(() => createFluentQuery(null)),
        create: jest.fn(async (docs) => {
            if (Array.isArray(docs)) {
                return docs.map((d, i) => ({ ...d, _id: d._id || `mock_id_${i + 1}` }));
            }
            return { ...docs, _id: docs?._id || 'mock_id_1', toObject: () => ({ ...docs }) };
        }),
        aggregate: jest.fn().mockResolvedValue([]),
        countDocuments: jest.fn().mockResolvedValue(0),
        updateOne: jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
        updateMany: jest.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
        deleteOne: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ acknowledged: true, deletedCount: 1 })
    };
    return Object.assign(baseModel, overrides);
};

/**
 * Creates all 30 models from src/core/Models/index.js.
 * Unspecified models automatically use createDynamicModel().
 */
export const createMockModels = (overrides = {}) => {
    const models = {};
    for (const name of modelNames) {
        models[name] = overrides[name] || createDynamicModel();
    }
    return models;
};

/**
 * Creates mock Mongoose transaction session.
 */
export const createMockSession = () => ({
    withTransaction: jest.fn(async (cb) => await cb()),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn()
});

/**
 * Creates mock Mongoose module object.
 */
export const createMockMongoose = (overrides = {}) => {
    const session = createMockSession();
    const mockObjectId = Object.assign(
        jest.fn((id) => id),
        { isValid: jest.fn(() => true) }
    );
    const mockMongoose = {
        startSession: jest.fn().mockResolvedValue(session),
        Types: { ObjectId: mockObjectId },
        Schema: Object.assign(
            jest.fn(() => ({
                virtual: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                index: jest.fn().mockReturnThis(),
                pre: jest.fn().mockReturnThis(),
                post: jest.fn().mockReturnThis(),
                methods: {},
                statics: {}
            })),
            { Types: { ObjectId: mockObjectId } }
        ),
        model: jest.fn(),
        models: {},
        connection: { db: { stats: jest.fn().mockResolvedValue({}) } }
    };
    return Object.assign(mockMongoose, overrides);
};

/**
 * Creates mock CacheService.
 */
export const createMockCacheService = (overrides = {}) => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    ...overrides
});
