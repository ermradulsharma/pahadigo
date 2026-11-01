import mongoose from 'mongoose';
import { getLogger } from '@/core/Lib/logger.js';
import {
    AuditLog,
    Banner,
    Blog,
    Booking,
    Category,
    CategoryDocument,
    ChatMessage,
    Conversation,
    Country,
    Coupon,
    Dispute,
    EmergencyAlert,
    Inquiry,
    Inventory,
    Message,
    Notification,
    Package,
    Policy,
    Review,
    SearchLog,
    Setting,
    State,
    User,
    Vendor,
    VendorClosure,
    VendorDocument,
    WebhookEvent,
    Wishlist
} from '@/core/Models/index.js';
import { SCHEMA_KEYS, CATEGORY_MAP } from '@/core/Constants/categories.js';

/**
 * Helper to ensure populated paths are included in explicit string projections.
 */
const ensurePopulatePathInSelect = (select, populate) => {
    if (!select || typeof select !== 'string') return select;
    if (!populate) return select;

    let selectStr = select;
    const paths = Array.isArray(populate) ? populate.map(p => (typeof p === 'string' ? p : p?.path)).filter(Boolean) : [typeof populate === 'string' ? populate : populate?.path].filter(Boolean);
    for (const p of paths) {
        if (!selectStr.split(/\s+/).includes(p)) selectStr = `${selectStr} ${p}`;
    }
    return selectStr;
};

/**
 * Generic helper to fetch a single document by ID with projection, population, lean, and optional session.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {string|import('mongoose').Types.ObjectId} id - The document ID
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @param {Object} [options={}] - Options like { session, lean: true }
 * @returns {Promise<Object|null>} - The document or null
 */
export const getById = async (Model, id, select = '', populate = null, options = {}) => {
    if (!id || !Model || typeof Model.findById !== 'function') return null;
    let query = Model.findById(id);
    if (!query) return null;
    if (select && typeof query?.select === 'function') query = query.select(ensurePopulatePathInSelect(select, populate)) || query;
    if (populate && typeof query?.populate === 'function') query = query.populate(populate) || query;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (options.lean !== false && typeof query?.lean === 'function') query = query.lean() || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

/**
 * Generic helper to fetch a single document by any custom conditions with projection, population, lean, and optional session.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {Object} conditions - Query criteria (e.g. { email: '...' })
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @param {Object} [options={}] - Options like { session, lean: true }
 * @returns {Promise<Object|null>} - The document or null
 */
export const getBy = async (Model, conditions, select = '', populate = null, options = {}) => {
    if (!conditions || Object.keys(conditions).length === 0 || !Model || typeof Model.findOne !== 'function') return null;
    let query = Model.findOne(conditions);
    if (!query) return null;
    if (select && typeof query?.select === 'function') query = query.select(ensurePopulatePathInSelect(select, populate)) || query;
    if (populate && typeof query?.populate === 'function') query = query.populate(populate) || query;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (options.lean !== false && typeof query?.lean === 'function') query = query.lean() || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

/**
 * Generic helper to fetch multiple documents by custom conditions with projection, population, lean, sorting, and optional session.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {Object} conditions - Query criteria (e.g. { status: 'active' })
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @param {string|Object} sort - Sorting options (e.g. { createdAt: -1 })
 * @param {Object} [options={}] - Options like { skip, limit, session, lean: true }
 * @returns {Promise<Array>} - Array of documents
 */
export const getManyBy = async (Model, conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    if (!Model || typeof Model.find !== 'function') return [];
    let query = Model.find(conditions);
    if (!query) return [];
    if (select && typeof query?.select === 'function') query = query.select(ensurePopulatePathInSelect(select, populate)) || query;
    if (populate && typeof query?.populate === 'function') query = query.populate(populate) || query;
    if (sort && typeof query?.sort === 'function') query = query.sort(sort) || query;
    if (options.skip !== undefined && typeof query?.skip === 'function') query = query.skip(Number(options.skip)) || query;
    if (options.limit !== undefined && typeof query?.limit === 'function') query = query.limit(Number(options.limit)) || query;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (options.lean !== false && typeof query?.lean === 'function') query = query.lean() || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

/**
 * Generic helper to count documents matching custom conditions with optional session.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {Object} conditions - Query criteria
 * @param {Object} [options={}] - Options like { session }
 * @returns {Promise<number>}
 */
export const countBy = async (Model, conditions = {}, options = {}) => {
    if (!Model || typeof Model.countDocuments !== 'function') return 0;
    let query = Model.countDocuments(conditions);
    if (!query) return 0;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

// =========================================================================
// MODEL SPECIFIC WRAPPERS (User, Vendor, Booking, Package, etc.)
// =========================================================================

/**
 * Fetch a User record by custom conditions.
 */
export const getUserBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(User, conditions, select, populate, options);
};

/**
 * Fetch a User record by ID.
 */
export const getUserById = async (id, select = '', populate = null, options = {}) => {
    return await getById(User, id, select, populate, options);
};

/**
 * Fetch multiple User records by custom conditions.
 */
export const getUsersBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(User, conditions, select, populate, sort, options);
};

/**
 * Count User records by custom conditions.
 */
export const countUsersBy = async (conditions = {}, options = {}) => {
    return await countBy(User, conditions, options);
};

/**
 * Fetch a Vendor (Business) record by custom conditions.
 */
export const getBusinessBy = async (conditions, select = '', populate = null, options = {}) => {
    const vendor = await getBy(Vendor, conditions, select, populate, options);
    if (vendor && vendor._id && mongoose.Types.ObjectId.isValid(vendor._id)) {
        try {
            const closures = await getManyBy(VendorClosure, { vendor: vendor._id, isActive: true }, '', null, { startDate: 1 }, options);
            if (closures) {
                vendor.closurePeriods = closures;
            }
        } catch (e) {
            getLogger().warn({ err: e, vendorId: vendor._id }, '[queryHelpers:getBusinessBy] Failed to load vendor closures');
        }
    }
    return vendor;
};

/**
 * Fetch a Vendor (Business) record by its Vendor ID.
 */
export const getBusinessById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Vendor, id, select, populate, options);
};

/**
 * Fetch a Vendor (Business) record by User ID.
 */
export const getBusinessByUserId = async (userId, select = '', populate = { path: 'user' }, options = {}) => {
    return await getBusinessBy({ user: userId, deletedAt: null }, select, populate, options);
};

/**
 * Fetch a Vendor (Business) record by both its Vendor ID and User ID.
 */
export const getBusinessByIdAndUserId = async (id, userId, select = '', populate = { path: 'user' }, options = {}) => {
    return await getBusinessBy({ _id: id, user: userId, deletedAt: null }, select, populate, options);
};

/**
 * Fetch multiple Vendor records by custom conditions.
 */
export const getVendorsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Vendor, conditions, select, populate, sort, options);
};

/**
 * Count Vendor records by custom conditions.
 */
export const countVendorsBy = async (conditions = {}, options = {}) => {
    return await countBy(Vendor, conditions, options);
};

/**
 * Fetch VendorDocument records by custom conditions.
 */
export const getVendorDocumentsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(VendorDocument, conditions, select, populate, sort, options);
};

/**
 * Fetch a single VendorDocument record by ID.
 */
export const getVendorDocumentById = async (id, select = '', populate = null, options = {}) => {
    return await getById(VendorDocument, id, select, populate, options);
};

/**
 * Fetch a single VendorDocument record by custom conditions.
 */
export const getVendorDocumentBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(VendorDocument, conditions, select, populate, options);
};

/**
 * Fetch VendorClosure records by custom conditions.
 */
export const getVendorClosuresBy = async (conditions = {}, select = '', populate = null, sort = { startDate: 1 }, options = {}) => {
    return await getManyBy(VendorClosure, conditions, select, populate, sort, options);
};

/**
 * Fetch a single VendorClosure record by custom conditions.
 */
export const getVendorClosureBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(VendorClosure, conditions, select, populate, options);
};

/**
 * Fetch a single VendorClosure record by ID.
 */
export const getVendorClosureById = async (id, select = '', populate = null, options = {}) => {
    return await getById(VendorClosure, id, select, populate, options);
};

/**
 * Fetch a Booking record by custom conditions.
 */
export const getBookingBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Booking, conditions, select, populate, options);
};

/**
 * Fetch a Booking record by ID.
 */
export const getBookingById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Booking, id, select, populate, options);
};

/**
 * Fetch multiple Booking records by custom conditions.
 */
export const getBookingsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Booking, conditions, select, populate, sort, options);
};

/**
 * Count Booking records by custom conditions.
 */
export const countBookingsBy = async (conditions = {}, options = {}) => {
    return await countBy(Booking, conditions, options);
};

/**
 * Fetch a Package record by custom conditions.
 */
export const getPackageBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Package, conditions, select, populate, options);
};

/**
 * Fetch a Package record by ID.
 */
export const getPackageById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Package, id, select, populate, options);
};

/**
 * Fetch multiple Package records by custom conditions.
 */
export const getPackagesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Package, conditions, select, populate, sort, options);
};

/**
 * Count Package records by custom conditions.
 */
export const countPackagesBy = async (conditions = {}, options = {}) => {
    return await countBy(Package, conditions, options);
};

/**
 * Fetch a specific package item (subdocument) by its ID.
 */
export const getPackageItemById = async (itemId, populate = null) => {
    const pkg = await getPackageBy({
        $or: Object.values(SCHEMA_KEYS).map(key => ({ [`${key}._id`]: itemId }))
    }, '', populate);

    if (!pkg) return null;

    for (const key of Object.values(SCHEMA_KEYS)) {
        if (Array.isArray(pkg[key])) {
            const item = pkg[key].find(i => i._id.toString() === itemId.toString());
            if (item) {
                const categorySlug = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === key) || key;
                const category = await getCategoryBySlug(categorySlug, '_id');

                return {
                    ...item,
                    category: key,
                    categoryId: category ? category._id.toString() : null,
                    catalogId: pkg._id.toString(),
                    vendor: pkg.vendor?._id ? pkg.vendor._id.toString() : (pkg.vendor ? pkg.vendor.toString() : null)
                };
            }
        }
    }
    return null;
};

/**
 * Fetch multiple Category records by custom conditions.
 */
export const getCategoriesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Category, conditions, select, populate, sort, options);
};

/**
 * Fetch a Category record by custom conditions.
 */
export const getCategoryBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Category, conditions, select, populate, options);
};

/**
 * Fetch a Category record by ID.
 */
export const getCategoryById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Category, id, select, populate, options);
};

/**
 * Fetch a Category record by Slug.
 */
export const getCategoryBySlug = async (slug, select = '', populate = null, options = {}) => {
    if (!slug) return null;
    return await getCategoryBy({ slug: (slug || '').toLowerCase() }, select, populate, options);
};

/**
 * Count Category records by custom conditions.
 */
export const countCategoriesBy = async (conditions = {}, options = {}) => {
    return await countBy(Category, conditions, options);
};

/**
 * Fetch multiple CategoryDocument records by custom conditions.
 */
export const getCategoryDocumentsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(CategoryDocument, conditions, select, populate, sort, options);
};

/**
 * Fetch a CategoryDocument record by custom conditions.
 */
export const getCategoryDocumentBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(CategoryDocument, conditions, select, populate, options);
};

/**
 * Fetch a CategoryDocument record by ID.
 */
export const getCategoryDocumentById = async (id, select = '', populate = null, options = {}) => {
    return await getById(CategoryDocument, id, select, populate, options);
};

/**
 * Fetch Review records by custom conditions.
 */
export const getReviewsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Review, conditions, select, populate, sort, options);
};

/**
 * Fetch a single Review record by custom conditions.
 */
export const getReviewBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Review, conditions, select, populate, options);
};

/**
 * Fetch a single Review record by ID.
 */
export const getReviewById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Review, id, select, populate, options);
};

/**
 * Count Review records by custom conditions.
 */
export const countReviewsBy = async (conditions = {}, options = {}) => {
    return await countBy(Review, conditions, options);
};

/**
 * Fetch visible Review records for a specific package item ID.
 */
export const getReviewsByItemId = async (itemId, populate = [{ path: 'user', select: 'name profileImage' }, { path: 'vendor', select: 'ownerName businessName profileImage' }]) => {
    if (!itemId) return [];
    let queryId = itemId;
    try {
        if (typeof itemId === 'string' && itemId.length === 24) {
            queryId = new mongoose.Types.ObjectId(itemId);
        }
    } catch (e) {
        getLogger().warn({ err: e, itemId }, '[queryHelpers:getReviewsByItemId] Failed to cast itemId to ObjectId');
    }

    return await getReviewsBy({
        $or: [
            { 'item.itemId': queryId },
            { 'item.itemId': itemId.toString() }
        ],
        isVisible: true
    }, '', populate);
};

/**
 * Fetch a single Notification record by custom conditions.
 */
export const getNotificationBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Notification, conditions, select, populate, options);
};

/**
 * Fetch a Notification record by ID.
 */
export const getNotificationById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Notification, id, select, populate, options);
};

/**
 * Fetch multiple Notification records by custom conditions.
 */
export const getNotificationsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Notification, conditions, select, populate, sort, options);
};

/**
 * Count Notification records by custom conditions.
 */
export const countNotificationsBy = async (conditions = {}, options = {}) => {
    return await countBy(Notification, conditions, options);
};

/**
 * Fetch a single Policy record by custom conditions.
 */
export const getPolicyBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Policy, conditions, select, populate, options);
};

/**
 * Fetch a Policy record by ID.
 */
export const getPolicyById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Policy, id, select, populate, options);
};

/**
 * Fetch multiple Policy records by custom conditions.
 */
export const getPoliciesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Policy, conditions, select, populate, sort, options);
};

/**
 * Fetch a single Blog record by custom conditions.
 */
export const getBlogBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Blog, conditions, select, populate, options);
};

/**
 * Fetch a Blog record by ID.
 */
export const getBlogById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Blog, id, select, populate, options);
};

/**
 * Fetch multiple Blog records by custom conditions.
 */
export const getBlogsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Blog, conditions, select, populate, sort, options);
};

/**
 * Count Blog records by custom conditions.
 */
export const countBlogsBy = async (conditions = {}, options = {}) => {
    return await countBy(Blog, conditions, options);
};

/**
 * Fetch a single Country record by custom conditions.
 */
export const getCountryBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Country, conditions, select, populate, options);
};

/**
 * Fetch a Country record by ID.
 */
export const getCountryById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Country, id, select, populate, options);
};

/**
 * Fetch multiple Country records by custom conditions.
 */
export const getCountriesBy = async (conditions = {}, select = '', populate = null, sort = { name: 1 }, options = {}) => {
    return await getManyBy(Country, conditions, select, populate, sort, options);
};

/**
 * Fetch a single State record by custom conditions.
 */
export const getStateBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(State, conditions, select, populate, options);
};

/**
 * Fetch a State record by ID.
 */
export const getStateById = async (id, select = '', populate = null, options = {}) => {
    return await getById(State, id, select, populate, options);
};

/**
 * Fetch multiple State records by custom conditions.
 */
export const getStatesBy = async (conditions = {}, select = '', populate = null, sort = { name: 1 }, options = {}) => {
    return await getManyBy(State, conditions, select, populate, sort, options);
};

/**
 * Fetch a single Inventory record by custom conditions.
 */
export const getInventoryBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Inventory, conditions, select, populate, options);
};

/**
 * Fetch an Inventory record by ID.
 */
export const getInventoryById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Inventory, id, select, populate, options);
};

/**
 * Fetch multiple Inventory records by custom conditions.
 */
export const getInventoriesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Inventory, conditions, select, populate, sort, options);
};

/**
 * Fetch a Setting record by custom conditions (default singleton {}).
 */
export const getSettingBy = async (conditions = {}, select = '', populate = null, options = {}) => {
    return await getBy(Setting, conditions, select, populate, options);
};

/**
 * Fetch a Setting record by ID.
 */
export const getSettingById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Setting, id, select, populate, options);
};

/**
 * Fetch multiple Setting records by custom conditions.
 */
export const getSettingsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Setting, conditions, select, populate, sort, options);
};

/**
 * Fetch a single Dispute record by custom conditions.
 */
export const getDisputeBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Dispute, conditions, select, populate, options);
};

/**
 * Fetch a Dispute record by ID.
 */
export const getDisputeById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Dispute, id, select, populate, options);
};

/**
 * Fetch multiple Dispute records by custom conditions.
 */
export const getDisputesBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Dispute, conditions, select, populate, sort, options);
};

/**
 * Count Dispute records by custom conditions.
 */
export const countDisputesBy = async (conditions = {}, options = {}) => {
    return await countBy(Dispute, conditions, options);
};

/**
 * Fetch a single Dispute Message record by custom conditions.
 */
export const getDisputeMessageBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Message, conditions, select, populate, options);
};

/**
 * Fetch multiple Dispute Message records by custom conditions.
 */
export const getDisputeMessagesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Message, conditions, select, populate, sort, options);
};

/**
 * Fetch a Wishlist record by custom conditions.
 */
export const getWishlistBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Wishlist, conditions, select, populate, options);
};

/**
 * Fetch a Wishlist record by ID.
 */
export const getWishlistById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Wishlist, id, select, populate, options);
};

/**
 * Fetch multiple Wishlist records by custom conditions.
 */
export const getWishlistsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Wishlist, conditions, select, populate, sort, options);
};

/**
 * Fetch an EmergencyAlert record by custom conditions.
 */
export const getEmergencyAlertBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(EmergencyAlert, conditions, select, populate, options);
};

/**
 * Fetch an EmergencyAlert record by ID.
 */
export const getEmergencyAlertById = async (id, select = '', populate = null, options = {}) => {
    return await getById(EmergencyAlert, id, select, populate, options);
};

/**
 * Fetch multiple EmergencyAlert records by custom conditions.
 */
export const getEmergencyAlertsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(EmergencyAlert, conditions, select, populate, sort, options);
};

/**
 * Count EmergencyAlert records by custom conditions.
 */
export const countEmergencyAlertsBy = async (conditions = {}, options = {}) => {
    return await countBy(EmergencyAlert, conditions, options);
};

/**
 * Fetch an Inquiry record by custom conditions.
 */
export const getInquiryBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Inquiry, conditions, select, populate, options);
};

/**
 * Fetch an Inquiry record by ID.
 */
export const getInquiryById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Inquiry, id, select, populate, options);
};

/**
 * Fetch multiple Inquiry records by custom conditions.
 */
export const getInquiriesBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Inquiry, conditions, select, populate, sort, options);
};

/**
 * Count Inquiry records by custom conditions.
 */
export const countInquiriesBy = async (conditions = {}, options = {}) => {
    return await countBy(Inquiry, conditions, options);
};

/**
 * Fetch a Coupon record by custom conditions.
 */
export const getCouponBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Coupon, conditions, select, populate, options);
};

/**
 * Fetch a Coupon record by ID.
 */
export const getCouponById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Coupon, id, select, populate, options);
};

/**
 * Fetch multiple Coupon records by custom conditions.
 */
export const getCouponsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(Coupon, conditions, select, populate, sort, options);
};

/**
 * Count Coupon records by custom conditions.
 */
export const countCouponsBy = async (conditions = {}, options = {}) => {
    return await countBy(Coupon, conditions, options);
};

/**
 * Fetch a Conversation record by custom conditions.
 */
export const getConversationBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Conversation, conditions, select, populate, options);
};

/**
 * Fetch a Conversation record by ID.
 */
export const getConversationById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Conversation, id, select, populate, options);
};

/**
 * Fetch multiple Conversation records by custom conditions.
 */
export const getConversationsBy = async (conditions = {}, select = '', populate = null, sort = { updatedAt: -1 }, options = {}) => {
    return await getManyBy(Conversation, conditions, select, populate, sort, options);
};

/**
 * Count Conversation records by custom conditions.
 */
export const countConversationsBy = async (conditions = {}, options = {}) => {
    return await countBy(Conversation, conditions, options);
};

/**
 * Fetch a ChatMessage record by custom conditions.
 */
export const getChatMessageBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(ChatMessage, conditions, select, populate, options);
};

/**
 * Fetch a ChatMessage record by ID.
 */
export const getChatMessageById = async (id, select = '', populate = null, options = {}) => {
    return await getById(ChatMessage, id, select, populate, options);
};

/**
 * Fetch multiple ChatMessage records by custom conditions.
 */
export const getChatMessagesBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: 1 }, options = {}) => {
    return await getManyBy(ChatMessage, conditions, select, populate, sort, options);
};

/**
 * Count ChatMessage records by custom conditions.
 */
export const countChatMessagesBy = async (conditions = {}, options = {}) => {
    return await countBy(ChatMessage, conditions, options);
};

/**
 * Fetch a WebhookEvent record by custom conditions.
 */
export const getWebhookEventBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(WebhookEvent, conditions, select, populate, options);
};

/**
 * Fetch a WebhookEvent record by ID.
 */
export const getWebhookEventById = async (id, select = '', populate = null, options = {}) => {
    return await getById(WebhookEvent, id, select, populate, options);
};

/**
 * Fetch multiple WebhookEvent records by custom conditions.
 */
export const getWebhookEventsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(WebhookEvent, conditions, select, populate, sort, options);
};

/**
 * Fetch an AuditLog record by custom conditions.
 */
export const getAuditLogBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(AuditLog, conditions, select, populate, options);
};

/**
 * Fetch an AuditLog record by ID.
 */
export const getAuditLogById = async (id, select = '', populate = null, options = {}) => {
    return await getById(AuditLog, id, select, populate, options);
};

/**
 * Fetch multiple AuditLog records by custom conditions.
 */
export const getAuditLogsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(AuditLog, conditions, select, populate, sort, options);
};

/**
 * Count AuditLog records by custom conditions.
 */
export const countAuditLogsBy = async (conditions = {}, options = {}) => {
    return await countBy(AuditLog, conditions, options);
};

/**
 * Fetch a Banner record by custom conditions.
 */
export const getBannerBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(Banner, conditions, select, populate, options);
};

/**
 * Fetch a Banner record by ID.
 */
export const getBannerById = async (id, select = '', populate = null, options = {}) => {
    return await getById(Banner, id, select, populate, options);
};

/**
 * Fetch multiple Banner records by custom conditions.
 */
export const getBannersBy = async (conditions = {}, select = '', populate = null, sort = { priority: -1 }, options = {}) => {
    return await getManyBy(Banner, conditions, select, populate, sort, options);
};

/**
 * Count Banner records by custom conditions.
 */
export const countBannersBy = async (conditions = {}, options = {}) => {
    return await countBy(Banner, conditions, options);
};

/**
 * Fetch a SearchLog record by custom conditions.
 */
export const getSearchLogBy = async (conditions, select = '', populate = null, options = {}) => {
    return await getBy(SearchLog, conditions, select, populate, options);
};

/**
 * Fetch multiple SearchLog records by custom conditions.
 */
export const getSearchLogsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }, options = {}) => {
    return await getManyBy(SearchLog, conditions, select, populate, sort, options);
};

/**
 * Count SearchLog records by custom conditions.
 */
export const countSearchLogsBy = async (conditions = {}, options = {}) => {
    return await countBy(SearchLog, conditions, options);
};

/**
 * Generic helper to update a single document by ID with optional session and lean.
 */
export const updateById = async (Model, id, updateData, options = {}) => {
    if (!id || !Model || typeof Model.findByIdAndUpdate !== 'function') return null;
    let query = Model.findByIdAndUpdate(id, updateData, { returnDocument: 'after', new: true, ...options });
    if (!query) return null;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (options.lean !== false && typeof query?.lean === 'function') query = query.lean() || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

/**
 * Generic helper to delete a single document by ID with optional session.
 */
export const deleteById = async (Model, id, options = {}) => {
    if (!id || !Model || typeof Model.findByIdAndDelete !== 'function') return null;
    let query = Model.findByIdAndDelete(id, options);
    if (!query) return null;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (typeof query?.exec === 'function') return await query.exec();
    return await query;
};

export default {
    getById,
    getBy,
    getManyBy,
    countBy,
    updateById,
    deleteById,
    // User
    getUserBy,
    getUserById,
    getUsersBy,
    countUsersBy,
    // Vendor
    getBusinessBy,
    getBusinessById,
    getBusinessByUserId,
    getBusinessByIdAndUserId,
    getVendorsBy,
    countVendorsBy,
    getVendorDocumentsBy,
    getVendorDocumentById,
    getVendorDocumentBy,
    getVendorClosureBy,
    getVendorClosureById,
    getVendorClosuresBy,
    // Booking
    getBookingBy,
    getBookingById,
    getBookingsBy,
    countBookingsBy,
    // Package
    getPackageBy,
    getPackageById,
    getPackagesBy,
    countPackagesBy,
    getPackageItemById,
    // Category
    getCategoryBy,
    getCategoriesBy,
    getCategoryById,
    getCategoryBySlug,
    countCategoriesBy,
    getCategoryDocumentBy,
    getCategoryDocumentById,
    getCategoryDocumentsBy,
    // Review
    getReviewBy,
    getReviewById,
    getReviewsBy,
    countReviewsBy,
    getReviewsByItemId,
    // Notification
    getNotificationBy,
    getNotificationById,
    getNotificationsBy,
    countNotificationsBy,
    // Policy
    getPolicyBy,
    getPolicyById,
    getPoliciesBy,
    // Blog
    getBlogBy,
    getBlogById,
    getBlogsBy,
    countBlogsBy,
    // Location
    getCountryBy,
    getCountryById,
    getCountriesBy,
    getStateBy,
    getStateById,
    getStatesBy,
    // Inventory
    getInventoryBy,
    getInventoryById,
    getInventoriesBy,
    // Setting
    getSettingBy,
    getSettingById,
    getSettingsBy,
    // Dispute & Messages
    getDisputeBy,
    getDisputeById,
    getDisputesBy,
    countDisputesBy,
    getDisputeMessageBy,
    getDisputeMessagesBy,
    // Chat
    getConversationBy,
    getConversationById,
    getConversationsBy,
    countConversationsBy,
    getChatMessageBy,
    getChatMessageById,
    getChatMessagesBy,
    countChatMessagesBy,
    // Emergency & Inquiry & Coupon
    getWishlistBy,
    getWishlistById,
    getWishlistsBy,
    getEmergencyAlertBy,
    getEmergencyAlertById,
    getEmergencyAlertsBy,
    countEmergencyAlertsBy,
    getInquiryBy,
    getInquiryById,
    getInquiriesBy,
    countInquiriesBy,
    getCouponBy,
    getCouponById,
    getCouponsBy,
    countCouponsBy,
    // Webhook & Audit & Banner & SearchLog
    getWebhookEventBy,
    getWebhookEventById,
    getWebhookEventsBy,
    getAuditLogBy,
    getAuditLogById,
    getAuditLogsBy,
    countAuditLogsBy,
    getBannerBy,
    getBannerById,
    getBannersBy,
    countBannersBy,
    getSearchLogBy,
    getSearchLogsBy,
    countSearchLogsBy
};
