import Vendor from '@/core/Models/Vendor.js';
import Package from '@/core/Models/Package.js';
import InventoryService from '@/core/Services/Vendor/InventoryService.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { slugify } from './stringUtils.js';
import { sellingPrice } from './sellingPrice.js';
import { mapToGeoJSON } from './geoUtils.js';
import { uploadToCloudinary } from './cloudinary.js';

/**
 * Unified item helper to handle authorization, catalog retrieval, photo upload,
 * creation or update, pricing/location formatting, saving, and inventory initialization.
 *
 * @param {string} userId - User ID of the vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} category - Service/item category slug
 * @param {Object} itemDataOrUpdates - Body payload or updates
 * @param {string|null} itemId - Item ID (null for creation, string for updates)
 * @returns {Promise<Object>} Formatted saved item
 */
export async function item(userId, vendorId, category, itemDataOrUpdates, itemId = null) {
    // 1. Validate vendor authorization for category
    const vendor = await Vendor.findById(vendorId);
    if (!vendor || !vendor.category) {
        throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
    }

    const allowed = new Set();
    vendor.category.forEach(c => {
        if (!c.slug) return;
        const slug = c.slug.toLowerCase();
        allowed.add(slug);
        if (CATEGORY_MAP[slug]) {
            allowed.add(CATEGORY_MAP[slug]);
        }
    });
    const allowedCategories = Array.from(allowed);

    if (!allowedCategories.includes(category)) {
        throw new Error(`Vendor not authorized to operate in category: ${category}`);
    }

    // 2. Find or create package catalog
    let pkg = await Package.findOne({ user: userId, vendor: vendorId });
    if (!pkg) {
        const initialData = {
            user: userId,
            vendor: vendorId
        };
        Object.values(SCHEMA_KEYS).forEach(key => { initialData[key] = []; });
        pkg = await Package.create(initialData);
    }

    const schemaKey = CATEGORY_MAP[category] || category;
    if (pkg[schemaKey] === undefined) {
        throw new Error(RESPONSE_MESSAGES.CATEGORY.INVALID);
    }

    // 3. Process and upload photos
    if (itemDataOrUpdates.photos) {
        const photoArray = Array.isArray(itemDataOrUpdates.photos) ? itemDataOrUpdates.photos : [itemDataOrUpdates.photos];
        const uploadResults = [];

        for (const photo of photoArray) {
            if (photo && typeof photo === 'object' && (photo instanceof File || photo.size > 0)) {
                try {
                    const uploaded = await uploadToCloudinary(photo, `packages/${vendorId}/${category}`);
                    uploadResults.push({ url: uploaded.url, type: 'image' });
                } catch (err) {
                    console.error(`[MEDIA_UPLOAD] Image upload failed:`, err);
                }
            } else if (typeof photo === 'object' && photo.url) {
                uploadResults.push(photo);
            } else if (typeof photo === 'string' && photo.startsWith('http')) {
                uploadResults.push({ url: photo, type: 'image' });
            }
        }

        if (uploadResults.length > 0) {
            itemDataOrUpdates.photos = uploadResults;
        } else if (!itemId) {
            delete itemDataOrUpdates.photos;
        }
    }

    // 4. Save or Update Subdocument
    let itemDoc;
    if (itemId) {
        // Update path
        itemDoc = pkg[schemaKey].id(itemId);
        if (!itemDoc) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        // Flatten nested objects into dot notation so we do partial updates
        const flattenObject = (obj, prefix = '') => {
            return Object.keys(obj).reduce((acc, k) => {
                const pre = prefix.length ? prefix + '.' : '';
                if (obj[k] !== null && typeof obj[k] === 'object' && obj[k].constructor === Object) {
                    Object.assign(acc, flattenObject(obj[k], pre + k));
                } else {
                    acc[pre + k] = obj[k];
                }
                return acc;
            }, {});
        };

        const flatUpdates = flattenObject(itemDataOrUpdates);
        Object.keys(flatUpdates).forEach(key => {
            itemDoc.set(key, flatUpdates[key]);
        });

        // Recalculate selling price if pricing fields were updated but sellingPrice wasn't explicitly supplied
        const isPricingUpdated = Object.keys(itemDataOrUpdates).some(key => key.startsWith('pricing') || key === 'pricing');
        const hasExplicitSellingPrice =
            (itemDataOrUpdates['pricing.sellingPrice'] !== undefined && itemDataOrUpdates['pricing.sellingPrice'] !== null && itemDataOrUpdates['pricing.sellingPrice'] !== '') ||
            (itemDataOrUpdates.pricing && itemDataOrUpdates.pricing.sellingPrice !== undefined && itemDataOrUpdates.pricing.sellingPrice !== null && itemDataOrUpdates.pricing.sellingPrice !== '');

        if (isPricingUpdated && !hasExplicitSellingPrice && itemDoc.pricing) {
            itemDoc.pricing.sellingPrice = null;
        }
    } else {
        // Add path
        const index = pkg[schemaKey].push(itemDataOrUpdates) - 1;
        itemDoc = pkg[schemaKey][index];
    }

    // 5. Apply Pre-save Formatting
    if (itemDoc.title) {
        itemDoc.slug = slugify(itemDoc.title);
    }

    if (itemDoc.pricing) {
        sellingPrice(itemDoc.pricing);
    }

    if (itemDoc.location) {
        mapToGeoJSON(itemDoc.location);
    }
    if (itemDoc.details && itemDoc.details.startPoint) {
        mapToGeoJSON(itemDoc.details.startPoint);
    }
    if (itemDoc.details && itemDoc.details.endPoint) {
        mapToGeoJSON(itemDoc.details.endPoint);
    }

    // 6. Save Catalog
    const saved = await pkg.save();

    // Retrieve the final saved subdocument
    const savedItem = itemId 
        ? saved[schemaKey].id(itemId) 
        : saved[schemaKey][saved[schemaKey].length - 1];

    // 7. Initialize inventory for new items
    if (!itemId && savedItem && savedItem._id) {
        try {
            await InventoryService.initializeFromItem(vendorId, savedItem._id, schemaKey);
        } catch (invError) {
            console.error('Inventory Initialization Failed:', invError);
        }
    }

    // 8. Format and return the result
    const itemObj = savedItem.toObject ? savedItem.toObject() : savedItem;
    const categoryObj = vendor.category.find(c => c.slug === category) || { name: category, _id: "" };

    return {
        id: itemObj._id,
        title: itemObj.title,
        slug: itemObj.slug,
        isActive: itemObj.isActive,
        availability: itemObj.availability || {},
        pricing: itemObj.pricing || {},
        location: itemObj.location || {},
        photos: itemObj.photos?.[0] || "",
        category_name: categoryObj.name || "",
        category_slug: category,
        category_id: categoryObj._id || ""
    };
}
