import Package from '@/core/Models/Package.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { CATEGORY_MAP, SCHEMA_KEYS } from '@/core/Constants/categories.js';
import MasterService from '@/core/Services/MasterService.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { getPackageItemById, getReviewsByItemId } from '@/core/Helpers/queryHelpers.js';
import { businessPayload, itemBusinessPayload, vendorPackageItem, userPayloadMini, businessPayloadMini } from '@/core/Helpers/index.js';

/**
 * Returns aggregation stages to flatten multi-category package subdocuments into a single 'items' stream.
 * @param {Object} options
 * @param {string} options.catalogPrefix - Prefix if catalog is a joined document (e.g. 'catalog')
 * @param {Object} options.extraProjectFields - Extra fields to retain in the projection (e.g. { vendor: 1 })
 * @returns {Array<Object>}
 */
export function getFlattenPackageItemsStages({ catalogPrefix = '', extraProjectFields = {} } = {}) {
    const prefix = catalogPrefix ? `${catalogPrefix}.` : '';
    const catalogIdField = catalogPrefix ? `$${catalogPrefix}._id` : '$_id';

    return [
        {
            $project: {
                ...extraProjectFields,
                items: {
                    $concatArrays: Object.values(SCHEMA_KEYS).map(key => ({
                        $map: {
                            input: { $ifNull: [`$${prefix}${key}`, []] },
                            as: "item",
                            in: {
                                $mergeObjects: [
                                    "$$item",
                                    { category: key, catalogId: catalogIdField }
                                ]
                            }
                        }
                    }))
                }
            }
        },
        { $unwind: "$items" }
    ];
}

/**
 * Returns the $lookup aggregation stage for reviews, including populated user and vendor profiles.
 * @param {string} itemIdField - Expression pointing to the item's ObjectId (defaults to "$items._id")
 * @returns {Object}
 */
export function getReviewsLookupStage(itemIdField = "$items._id") {
    return {
        $lookup: {
            from: 'reviews',
            let: { itemId: itemIdField },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $or: [
                                        { $eq: ["$item.itemId", "$$itemId"] },
                                        { $eq: [{ $toString: "$item.itemId" }, { $toString: "$$itemId" }] }
                                    ]
                                },
                                { $eq: ["$isVisible", true] }
                            ]
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: "$user" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: [
                                            { $toString: "$_id" },
                                            { $toString: "$$userId" }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: { $toString: "$_id" },
                                    name: 1,
                                    profileImage: 1
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'vendors',
                        let: { vendorId: "$vendor" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: [
                                            { $toString: "$_id" },
                                            { $toString: "$$vendorId" }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    id: { $toString: "$_id" },
                                    ownerName: 1,
                                    businessName: 1,
                                    profileImage: 1
                                }
                            }
                        ],
                        as: 'vendor'
                    }
                },
                { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
                { $addFields: { id: { $toString: "$_id" } } }
            ],
            as: 'reviews'
        }
    };
}

/**
 * Returns aggregation stages to lookup and unwind the vendor profile.
 * @param {string} packageVendorField - Field expression for the vendor ID (e.g. "$vendor")
 * @returns {Array<Object>}
 */
export function getVendorProfileLookupStages(packageVendorField = "$vendor") {
    return [
        {
            $lookup: {
                from: 'vendors',
                let: { packageVendor: packageVendorField },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$_id",
                                    "$$packageVendor"
                                ]
                            }
                        }
                    }
                ],
                as: 'vendorProfile'
            }
        },
        { $unwind: { path: '$vendorProfile', preserveNullAndEmptyArrays: true } }
    ];
}

/**
 * Returns a standardized $project stage for flattened package items.
 * @param {Object} extraFields - Any additional fields to project (e.g. { distance: "$vendorProfile.distance" })
 * @param {string} idField - Name of the ID field in projection ('_id' or 'id')
 * @returns {Object}
 */
export function getPackageItemProjectionStage(extraFields = {}, idField = '_id') {
    return {
        $project: {
            [idField]: "$items._id",
            title: "$items.title",
            isActive: "$items.isActive",
            pricing: "$items.pricing",
            pricePerNight: "$items.pricePerNight",
            pricePerPerson: "$items.pricePerPerson",
            pricePerDay: "$items.pricePerDay",
            location: "$items.location",
            photos: "$items.photos",
            category: "$items.category",
            catalogId: "$items.catalogId",
            reviews: "$reviews",
            ...extraFields
        }
    };
}

/**
 * Normalizes and autocorrects coordinates (e.g. India Lat/Lng flip).
 * @param {number|string} lat
 * @param {number|string} lng
 * @returns {{ latitude: number, longitude: number, hasCoords: boolean }}
 */
export function normalizeCoordinates(lat, lng) {
    let latitude = parseFloat(lat);
    let longitude = parseFloat(lng);

    // Auto-correct swapped lat/lng for India coordinates (Lat: 8-37°N, Lng: 68-97°E)
    if (!isNaN(latitude) && !isNaN(longitude) && latitude > 45 && longitude < 45) {
        const temp = latitude;
        latitude = longitude;
        longitude = temp;
    }

    const hasCoords = !isNaN(longitude) && !isNaN(latitude);
    return { latitude, longitude, hasCoords };
}

/**
 * Fetches tax rates (gst, serviceTax) from application configuration.
 * @returns {Promise<{ gst: number, serviceTax: number }>}
 */
export async function getTaxConfig() {
    const config = await getAppConfig();
    return {
        gst: config.tax?.gst || 0,
        serviceTax: config.tax?.service_tax || 0
    };
}

/**
 * Applies taxes to an item's pricing object.
 * @param {Object} pricing
 * @param {{ gst: number, serviceTax: number }} taxes
 * @returns {Object}
 */
export function applyTaxesToPricing(pricing = {}, taxes = { gst: 0, serviceTax: 0 }) {
    return {
        ...(pricing || {}),
        gst: taxes.gst,
        serviceTax: taxes.serviceTax
    };
}

/**
 * Enriches a list of items with the latest tax configuration.
 * @param {Array<Object>} items
 * @returns {Promise<Array<Object>>}
 */
export async function enrichItemsWithTaxes(items) {
    const taxes = await getTaxConfig();
    return (items || []).map(item => ({
        ...item,
        pricing: applyTaxesToPricing(item.pricing, taxes)
    }));
}

/**
 * Shared core logic to retrieve an available package item with populated business & compliance checks.
 * @param {string} itemId - Package item ObjectId string
 * @param {Object} masterService - MasterService instance
 * @returns {Promise<Object|null>} Available package item or null
 */
export async function getItemDetailsPayload(itemId, masterService = MasterService) {
    if (!itemId) return null;

    const item = await getPackageItemById(itemId);
    if (!item) return null;

    const pkg = await Package.findById(item.catalogId).populate({ path: 'vendor', populate: { path: 'user' } }).lean();
    if (!pkg || !(await masterService.isVendorActive(pkg.vendor))) return null;

    const slug = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === item.category) || item.category;
    if (!(await masterService.isCategoryVerified(pkg.vendor._id, slug))) return null;

    if (item.isActive === false) return null;

    const config = await getAppConfig();
    if (item.pricing) item.pricing.serviceTax = config.tax?.service_tax || 0;

    if (pkg.vendor) {
        const businessObj = itemBusinessPayload(pkg.vendor);
        item.business = businessObj;
    }

    const rawReviews = await getReviewsByItemId(item._id);
    const reviews = await Promise.all(
        rawReviews.map(async (r) => {
            const u = await userPayloadMini(r.user?._id || r.user);
            const v = await businessPayloadMini(r.vendor?._id || r.vendor);
            return {
                ...r,
                id: (r.id || r._id)?.toString() || '',
                user: u ? { ...u, avatar: u.avatar || u.profileImage } : null,
                vendor: v
            };
        })
    );

    return vendorPackageItem(item, reviews);
}

/**
 * Calculates straight-line distance between two geo coordinates in Kilometers (Haversine Formula).
 * 
 * @param {number} lat1 - Latitude of the first point
 * @param {number} lon1 - Longitude of the first point
 * @param {number} lat2 - Latitude of the second point
 * @param {number} lon2 - Longitude of the second point
 * @returns {number|null} Distance in kilometers, or null if inputs are invalid
 * 
 * 
 * Formula (Haversine)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
}


export default {
    getItemDetailsPayload,
    getFlattenPackageItemsStages,
    getReviewsLookupStage,
    getVendorProfileLookupStages,
    getPackageItemProjectionStage,
    normalizeCoordinates,
    getTaxConfig,
    applyTaxesToPricing,
    enrichItemsWithTaxes
};
