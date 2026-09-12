import Vendor from '@/core/Models/Vendor.js';
import Package from '@/core/Models/Package.js';
import InventoryService from '@/core/Services/Vendor/InventoryService.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { slugify } from './stringUtils.js';
import { sellingPrice } from './sellingPrice.js';
import { mapToGeoJSON } from './geoUtils.js';
import { uploadToCloudinary } from './cloudinary.js';
import AppError from '@/core/Helpers/AppError.js';
import { notifyIndexNow } from './indexNow.js';
import { getLocationPoint } from './addressHelper.js';
import { getLogger } from '@/core/Lib/logger.js';
import { getPackageBy } from './queryHelpers.js';

/**
 * Recursively flattens nested objects into dot notation for partial Mongoose subdocument updates.
 * @param {Object} obj - Nested object to flatten
 * @param {string} prefix - Key prefix
 * @returns {Object} Flattened object with dot-notation keys
 */
export function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (obj[k] !== null && typeof obj[k] === 'object' && obj[k].constructor === Object) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}

/**
 * Processes photo inputs, uploading files/buffers to Cloudinary or formatting URL objects.
 * @param {Array|Object|string} photos - Photo input(s)
 * @param {string} uploadPath - Cloudinary folder path
 * @returns {Promise<Array>} Standardized photo array
 */
export async function processItemPhotos(photos, uploadPath) {
    if (!photos) return [];
    const photoArray = Array.isArray(photos) ? photos : [photos];
    const uploadResults = [];

    for (const photo of photoArray) {
        if (photo && typeof photo === 'object' && (photo instanceof File || photo.size > 0)) {
            try {
                const uploaded = await uploadToCloudinary(photo, uploadPath);
                uploadResults.push({ url: uploaded.url, type: 'image' });
            } catch (err) {
                getLogger().error({ err }, '[MEDIA_UPLOAD] Image upload failed');
            }
        } else if (typeof photo === 'object' && photo.url) {
            uploadResults.push(photo);
        } else if (typeof photo === 'string' && photo.startsWith('http')) {
            uploadResults.push({ url: photo, type: 'image' });
        }
    }

    return uploadResults;
}

/**
 * Finds or initializes a vendor's package catalog document.
 * @param {string} userId - User ID
 * @param {string} vendorId - Vendor ID
 * @param {boolean} [lean=false] - Whether to return a lean JS object
 * @returns {Promise<Object>} Package catalog document or object
 */
export async function findOrCreateCatalog(userId, vendorId, lean = false) {
    if (!userId || !vendorId) throw new Error(RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
    let pkg = lean ? await getPackageBy({ user: userId, vendor: vendorId }) : await Package.findOne({ user: userId, vendor: vendorId });
    if (!pkg) {
        const initialData = { user: userId, vendor: vendorId };
        Object.values(SCHEMA_KEYS).forEach(key => { initialData[key] = []; });
        const createdPkg = await Package.create(initialData);
        pkg = lean ? (createdPkg.toObject ? createdPkg.toObject() : createdPkg) : createdPkg;
    }
    return pkg;
}

/**
 * Unified item helper to handle authorization, catalog retrieval, photo upload,
 * creation or update, pricing/location formatting, saving, and inventory initialization.
 *
 * @param {string} userId - User ID of the vendor
 * @param {string} businessId - Business/Vendor ID
 * @param {string} category - Service/item category slug
 * @param {Object} itemDataOrUpdates - Body payload or updates
 * @param {string|null} itemId - Item ID (null for creation, string for updates)
 * @returns {Promise<Object>} Formatted saved item
 */
export async function item(userId, businessId, category, itemDataOrUpdates, itemId = null) {
    // 1. Validate vendor authorization for category
    const business = await Vendor.findById(businessId).select('category').lean();
    if (!business) throw AppError.notFound(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const allowed = new Set();
    (business.category || []).forEach(c => {
        if (!c.slug) return;
        const slug = c.slug.toLowerCase();
        allowed.add(slug);
        if (CATEGORY_MAP[slug]) allowed.add(CATEGORY_MAP[slug]);
    });
    const allowedCategories = Array.from(allowed);
    if (!allowedCategories.includes(category)) throw AppError.forbidden(`Vendor not authorized to operate in category: ${category}`);

    // 2. Find or create package catalog
    const pkg = await findOrCreateCatalog(userId, businessId);

    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) throw AppError.badRequest(RESPONSE_MESSAGES.CATEGORY.INVALID);

    // 3. Process and upload photos
    if (itemDataOrUpdates.photos) {
        const uploadResults = await processItemPhotos(itemDataOrUpdates.photos, `packages/${businessId}/${category}`);
        if (uploadResults.length > 0) {
            itemDataOrUpdates.photos = uploadResults;
        } else if (!itemId) {
            delete itemDataOrUpdates.photos;
        }
    }

    // 4. Pre-process and calculate Pricing BEFORE subdocument mutation
    let itemDoc;
    const pricingInput = itemDataOrUpdates.pricing;

    if (itemId) {
        // Update path: Find subdocument first
        itemDoc = pkg[schemaKey].id(itemId);
        if (!itemDoc) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        if (pricingInput && typeof pricingInput === 'object') {
            const currentPricing = itemDoc.pricing?.toObject?.() || itemDoc.pricing || {};
            itemDataOrUpdates.pricing = await sellingPrice(pricingInput, category, currentPricing);
        }

        const flatUpdates = flattenObject(itemDataOrUpdates);
        Object.keys(flatUpdates).forEach(key => itemDoc.set(key, flatUpdates[key]));

    } else {
        // Add path: Map pricingInput into structured pricing object
        if (pricingInput && typeof pricingInput === 'object') itemDataOrUpdates.pricing = await sellingPrice(pricingInput, category);

        const index = pkg[schemaKey].push(itemDataOrUpdates) - 1;
        itemDoc = pkg[schemaKey][index];
    }

    // 5. Apply Pre-save Formatting
    if (itemDoc.title) itemDoc.slug = slugify(itemDoc.title);
    if (itemDoc.location) mapToGeoJSON(itemDoc.location);
    if (itemDoc.details && itemDoc.details.startPoint) mapToGeoJSON(itemDoc.details.startPoint);
    if (itemDoc.details && itemDoc.details.endPoint) mapToGeoJSON(itemDoc.details.endPoint);

    // 6. Save Catalog
    const saved = await pkg.save();

    // Retrieve the final saved subdocument
    const savedItem = itemId ? saved[schemaKey].id(itemId) : saved[schemaKey][saved[schemaKey].length - 1];

    // 7. Initialize inventory for new items
    if (!itemId && savedItem && savedItem._id) {
        try {
            await InventoryService.initializeFromItem(businessId, savedItem._id, schemaKey);
        } catch (invError) {
            getLogger().error({ err: invError }, 'Inventory Initialization Failed');
        }
    }

    // 8. Auto-notify IndexNow for Search Engine Indexation
    if (savedItem && savedItem._id) notifyIndexNow([`https://pahadigo.co.in/packages/${savedItem._id}`]).catch(() => { });

    // 9. Format and return the result using normalizePackageItem
    const base = normalizePackageItem(savedItem);
    const categoryObj = (business.category || []).find(c => c.slug === category) || { name: category, _id: "" };

    return {
        id: base.id,
        title: base.title,
        slug: base.slug,
        isActive: base.isActive,
        availability: base.itemObj.availability || {},
        pricing: base.pricing,
        address: base.address,
        location: base.location,
        photos: base.image,
        category_name: categoryObj.name || "",
        category_slug: category,
        category_id: categoryObj._id?.toString() || ""
    };
}

/**
 * Core helper to normalize common package item properties (DRY single source of truth).
 */
export function normalizePackageItem(item, reviews = []) {
    if (!item) return null;
    const itemObj = item.toObject ? item.toObject() : item;
    const reviewList = Array.isArray(reviews) && reviews.length > 0 ? reviews : (Array.isArray(itemObj.reviews) ? itemObj.reviews : []);

    let rating = itemObj.rating || { average: 0, count: 0 };
    if (reviewList.length > 0) {
        const totalRating = reviewList.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0);
        const count = reviewList.length;
        const average = Math.round((totalRating / count) * 10) / 10;
        rating = { average, count };
    }

    return {
        itemObj,
        id: (itemObj.id || itemObj._id)?.toString() || '',
        title: itemObj.title || '',
        slug: itemObj.slug || '',
        isActive: Boolean(itemObj.isActive),
        pricing: {
            basePrice: itemObj.pricing?.basePrice || 0,
            gst: itemObj.pricing?.gst || 0,
            sellingPrice: itemObj.pricing?.sellingPrice || 0
        },
        address: itemObj.location?.address || '',
        location: getLocationPoint(itemObj.location),
        image: itemObj.photos?.[0]?.url || itemObj.photos?.[0] || '',
        rating,
        reviews: reviewList
    };
}

/**
 * Formats package items grouped by schema keys.
 */
export function itemsFormate(packages) {
    const items = {};
    if (!packages) return items;
    Object.values(SCHEMA_KEYS).forEach(key => {
        const catItems = packages[key];
        items[key] = Array.isArray(catItems) ? catItems.map(item => vendorPackageItem(item)) : [];
    });
    return items;
}

/**
 * Formats a raw package item into standardized public API response shape with wishlist indicator.
 * @param {Object} item - Package item object
 * @param {Map} wishlistMap - Map of user wishlisted item IDs
 * @param {Array} reviews - Optional reviews array
 * @returns {Object} Standardized package item output
 */
export function formatPackageItem(item, wishlistMap = new Map(), reviews = []) {
    const base = normalizePackageItem(item, reviews);
    if (!base) return null;

    const { itemObj, id, title, pricing, address, location, image, rating, reviews: reviewList } = base;
    const isWishlisted = id ? wishlistMap.has(id) : false;
    const categoryId = (itemObj.categoryId || itemObj.category_id || itemObj.catalogId)?.toString() || '';

    return {
        id,
        title,
        categoryName: itemObj.categoryName || itemObj.category || '',
        categoryId,
        pricing,
        address,
        location,
        image,
        rating,
        reviews: reviewList,
        wishlist: isWishlisted
    };
}

/**
 * Formats a raw vendor catalog item into standardized vendor API response shape.
 * @param {Object} item - Vendor package item (Mongoose doc or object)
 * @param {string} [categorySlug=''] - Category slug
 * @param {Array} [vendorCategories=[]] - Vendor categories array from Vendor model
 * @returns {Object} Standardized vendor package item
 */
export function vendorPackagePayload(item, categorySlug = '', vendorCategories = []) {
    const base = normalizePackageItem(item);
    if (!base) return null;

    const { id, title, slug, isActive, pricing, address, location, image } = base;
    const category = vendorCategories.find(c => c.slug === categorySlug) || {};

    return {
        id,
        title,
        slug,
        isActive,
        pricing,
        address,
        location,
        image,
        category: {
            id: category._id?.toString() || '',
            name: category.name || categorySlug,
            slug: categorySlug
        }
    };
}

/**
 * Formats a single vendor package item response with calculated rating & reviews.
 */
export function vendorPackageItem(item, reviews = []) {
    const base = normalizePackageItem(item, reviews);
    if (!base) return null;

    const { itemObj, address, location, rating, reviews: reviewList } = base;

    return {
        ...itemObj,
        address,
        location,
        rating,
        reviews: reviewList
    };
}

