import { User, Vendor, Booking, Package, Category, VendorDocument } from '@/core/Models/index.js';
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
 * Generic helper to fetch a single document by ID with projection, population, and lean enabled.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {string|import('mongoose').Types.ObjectId} id - The document ID
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @returns {Promise<Object|null>} - The lean document or null
 */
export const getById = async (Model, id, select = '', populate = null) => {
    if (!id) return null;
    let query = Model.findById(id);
    if (select) query = query.select(ensurePopulatePathInSelect(select, populate));
    if (populate) query = query.populate(populate);
    return await query.lean();
};

/**
 * Generic helper to fetch a single document by any custom conditions with projection, population, and lean.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {Object} conditions - Query criteria (e.g. { email: '...' })
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @returns {Promise<Object|null>} - The lean document or null
 */
export const getBy = async (Model, conditions, select = '', populate = null) => {
    if (!conditions || Object.keys(conditions).length === 0) return null;
    let query = Model.findOne(conditions);
    if (select) query = query.select(ensurePopulatePathInSelect(select, populate));
    if (populate) query = query.populate(populate);
    return await query.lean();
};

/**
 * Generic helper to fetch multiple documents by custom conditions with projection, population, lean, and sorting.
 * @param {import('mongoose').Model} Model - The Mongoose model to query
 * @param {Object} conditions - Query criteria (e.g. { status: 'active' })
 * @param {string|Object} select - Space-separated fields or projection object
 * @param {string|Object|Array} populate - Population options
 * @param {string|Object} sort - Sorting options (e.g. { createdAt: -1 })
 * @returns {Promise<Array>} - Array of lean documents
 */
export const getManyBy = async (Model, conditions = {}, select = '', populate = null, sort = null) => {
    let query = Model.find(conditions);
    if (select) query = query.select(ensurePopulatePathInSelect(select, populate));
    if (populate) query = query.populate(populate);
    if (sort) query = query.sort(sort);
    return await query.lean();
};

// =========================================================================
// MODEL SPECIFIC WRAPPERS (User, Vendor, Booking, Package, etc.)
// =========================================================================

/**
 * Fetch a User record by custom conditions.
 */
export const getUserBy = async (conditions, select = '', populate = null) => {
    return await getBy(User, conditions, select, populate);
};

/**
 * Fetch a User record by ID.
 */
export const getUserById = async (id, select = '', populate = null) => {
    return await getById(User, id, select, populate);
};

/**
 * Fetch a Vendor (Business) record by custom conditions.
 */
export const getBusinessBy = async (conditions, select = '', populate = null) => {
    return await getBy(Vendor, conditions, select, populate);
};

/**
 * Fetch a Vendor (Business) record by its Vendor ID.
 */
export const getBusinessById = async (id, select = '', populate = null) => {
    return await getById(Vendor, id, select, populate);
};

/**
 * Fetch a Vendor (Business) record by User ID.
 */
export const getBusinessByUserId = async (userId, select = '', populate = { path: 'user' }) => {
    return await getBusinessBy({ user: userId, deletedAt: null }, select, populate);
};

/**
 * Fetch VendorDocument records by custom conditions.
 */
export const getVendorDocumentsBy = async (conditions = {}, select = '', populate = null, sort = null) => {
    return await getManyBy(VendorDocument, conditions, select, populate, sort);
};

/**
 * Fetch a Booking record by custom conditions.
 */
export const getBookingBy = async (conditions, select = '', populate = null) => {
    return await getBy(Booking, conditions, select, populate);
};

/**
 * Fetch a Booking record by ID.
 */
export const getBookingById = async (id, select = '', populate = null) => {
    return await getById(Booking, id, select, populate);
};

/**
 * Fetch a Package record by custom conditions.
 */
export const getPackageBy = async (conditions, select = '', populate = null) => {
    return await getBy(Package, conditions, select, populate);
};

/**
 * Fetch a Package record by ID.
 */
export const getPackageById = async (id, select = '', populate = null) => {
    return await getById(Package, id, select, populate);
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
 * Fetch a Category record by slug.
 */
export const getCategoryBySlug = async (slug, select = '', populate = null) => {
    return await getBy(Category, { slug: slug.toLowerCase() }, select, populate);
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

export default {
    getById,
    getBy,
    getManyBy,
    getUserBy,
    getUserById,
    getBusinessBy,
    getBusinessById,
    getBusinessByUserId,
    getVendorDocumentsBy,
    getBookingBy,
    getBookingById,
    getPackageBy,
    getPackageById,
    getPackageItemById,
    getCategoryBy,
    getCategoryById,
    getCategoryBySlug
};
