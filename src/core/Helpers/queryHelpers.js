import { User, Vendor, Booking, Package, Category, VendorDocument, VendorClosure, Review } from '@/core/Models/index.js';
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
 * @param {Object} [options={}] - Options like { session, lean: true }
 * @returns {Promise<Array>} - Array of documents
 */
export const getManyBy = async (Model, conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    if (!Model || typeof Model.find !== 'function') return [];
    let query = Model.find(conditions);
    if (!query) return [];
    if (select && typeof query?.select === 'function') query = query.select(ensurePopulatePathInSelect(select, populate)) || query;
    if (populate && typeof query?.populate === 'function') query = query.populate(populate) || query;
    if (sort && typeof query?.sort === 'function') query = query.sort(sort) || query;
    if (options.session && typeof query?.session === 'function') query = query.session(options.session) || query;
    if (options.lean !== false && typeof query?.lean === 'function') query = query.lean() || query;
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
 * Fetch a Vendor (Business) record by custom conditions.
 */
export const getBusinessBy = async (conditions, select = '', populate = null, options = {}) => {
    const vendor = await getBy(Vendor, conditions, select, populate, options);
    if (vendor && vendor._id) {
        try {
            const closures = await getManyBy(VendorClosure, { vendor: vendor._id, isActive: true }, '', null, { startDate: 1 }, options);
            if (closures) {
                vendor.closurePeriods = closures;
            }
        } catch (e) { }
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
 * Fetch VendorDocument records by custom conditions.
 */
export const getVendorDocumentsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(VendorDocument, conditions, select, populate, sort, options);
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
 * Fetch multiple Category records by custom conditions.
 */
export const getCategoriesBy = async (conditions = {}, select = '', populate = null, sort = null) => {
    return await getManyBy(Category, conditions, select, populate, sort);
};

/**
 * Fetch a Category record by custom conditions.
 */
export const getCategoryBy = async (conditions, select = '', populate = null) => {
    return await getBy(Category, conditions, select, populate);
};

/**
 * Fetch a Category record by ID.
 */
export const getCategoryById = async (id, select = '', populate = null) => {
    return await getById(Category, id, select, populate);
};

/**
 * Fetch a Category record by Slug.
 */
export const getCategoryBySlug = async (slug, select = '', populate = null) => {
    if (!slug) return null;
    return await getCategoryBy({ slug: (slug || '').toLowerCase() }, select, populate);
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
 * Fetch Review records by custom conditions.
 */
export const getReviewsBy = async (conditions = {}, select = '', populate = null, sort = { createdAt: -1 }) => {
    return await getManyBy(Review, conditions, select, populate, sort);
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
    } catch (e) { }

    return await getReviewsBy({
        $or: [
            { 'item.itemId': queryId },
            { 'item.itemId': itemId.toString() }
        ],
        isVisible: true
    }, '', populate);
};

/**
 * Fetch multiple User records by custom conditions.
 */
export const getUsersBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(User, conditions, select, populate, sort, options);
};

/**
 * Fetch multiple Booking records by custom conditions.
 */
export const getBookingsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Booking, conditions, select, populate, sort, options);
};

/**
 * Fetch multiple Package records by custom conditions.
 */
export const getPackagesBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Package, conditions, select, populate, sort, options);
};

/**
 * Fetch multiple Vendor records by custom conditions.
 */
export const getVendorsBy = async (conditions = {}, select = '', populate = null, sort = null, options = {}) => {
    return await getManyBy(Vendor, conditions, select, populate, sort, options);
};

/**
 * Generic helper to update a single document by ID with optional session and lean.
 */
export const updateById = async (Model, id, updateData, options = {}) => {
    if (!id || !Model || typeof Model.findByIdAndUpdate !== 'function') return null;
    let query = Model.findByIdAndUpdate(id, updateData, { returnDocument: 'after', ...options });
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
    updateById,
    deleteById,
    getUserBy,
    getUserById,
    getUsersBy,
    getBusinessBy,
    getBusinessById,
    getBusinessByUserId,
    getBusinessByIdAndUserId,
    getVendorsBy,
    getVendorDocumentsBy,
    getBookingBy,
    getBookingById,
    getBookingsBy,
    getPackageBy,
    getPackageById,
    getPackagesBy,
    getPackageItemById,
    getCategoryBy,
    getCategoriesBy,
    getCategoryById,
    getCategoryBySlug,
    getReviewsBy,
    getReviewsByItemId
};

