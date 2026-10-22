/**
 * @file PackageService.js
 * @module core/Services/General/PackageService
 * @description General / Public Service managing package item availability, multi-tier search pipelines,
 * geo-spatial radius exploration, tax-enriched pricing, and vendor category compliance.
 *
 * Architecture & Key Responsibilities:
 * 1. Single & Batch Retrieval  : Efficient subdocument item queries with review metrics and tax calculation.
 * 2. Strict Compliance         : Integrates MasterService to enforce KYC status and active (non-expired) category permits.
 * 3. Aggregation Pipelines     : High-performance MongoDB pipelines utilizing $geoNear, $lookup, and $unwind.
 * 4. Browse Delegation         : Connects to browsePackages helper for multi-tier filtering, caching, and dual output formatting.
 * 5. Geo-Spatial Exploration   : Spherical radius distance calculation with graceful coordinate fallbacks.
 */

import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { STATUS } from '@/core/Constants/index.js';
import MasterService from '@/core/Services/MasterService.js';
import {
    getPackageItemById,
    getPackageById as fetchPackageById,
    getCategoriesBy
} from '@/core/Helpers/queryHelpers.js';
import {
    getItemDetailsPayload,
    getFlattenPackageItemsStages,
    getReviewsLookupStage,
    getVendorProfileLookupStages,
    getPackageItemProjectionStage,
    normalizeCoordinates,
    getTaxConfig,
    applyTaxesToPricing,
    enrichItemsWithTaxes
} from '@/core/Services/Shared/PackageCore.js';
import { getBrowsePackages } from '@/core/Helpers/browsePackages.js';

/**
 * PackageService (General Role)
 * Focuses on public package retrieval, availability checks, search pipelines, and geo-spatial queries.
 */
class PackageService {
    /**
     * Initializes PackageService with an instance of MasterService.
     *
     * @param {Object} [masterService=MasterService] - Compliance and vendor verification service
     */
    constructor(masterService = MasterService) {
        this.masterService = masterService;
    }

    // =========================================================================
    // 1. Single & Multiple Item Retrieval
    // =========================================================================

    /**
     * Retrieves an entire package document by its MongoDB ObjectId.
     *
     * @async
     * @param {string|mongoose.Types.ObjectId} id - Top-level package document ObjectId
     * @returns {Promise<Object|null>} Lean Package document or null if not found
     */
    async getPackageById(id) {
        return await fetchPackageById(id);
    }

    /**
     * Retrieves full, populated details for a single package subdocument item by its ObjectId.
     * Enforces active vendor status and category compliance (including non-expired documents).
     *
     * @async
     * @param {string|mongoose.Types.ObjectId} itemId - Package item subdocument ObjectId
     * @returns {Promise<Object|null>} Formatted package item payload or null if unavailable/non-compliant
     */
    async getAvailablePackageItem(itemId) {
        return await getItemDetailsPayload(itemId, this.masterService);
    }

    /**
     * Fast lookup for a package item subdocument without full compliance pipelines.
     *
     * @async
     * @param {string|mongoose.Types.ObjectId} itemId - Package item subdocument ObjectId
     * @returns {Promise<Object|null>} Package item subdocument or null
     */
    async getPackageItem(itemId) {
        return await getPackageItemById(itemId);
    }

    /**
     * Batch retrieves multiple package items by their ObjectIds, enriched with review metrics and tax pricing.
     *
     * @async
     * @param {Array<string|mongoose.Types.ObjectId>} itemIds - Array of package item subdocument ObjectIds
     * @returns {Promise<Array<Object>>} Enriched package items array
     */
    async getMultiplePackageItems(itemIds) {
        if (!itemIds || itemIds.length === 0) return [];
        const objectIds = itemIds.map(id => (typeof id === 'string' ? id : id.toString()));

        const items = await Package.aggregate([
            ...getFlattenPackageItemsStages(),
            { $match: { "items._id": { $in: objectIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            getReviewsLookupStage("$items._id"),
            getPackageItemProjectionStage({ category_slug: "$items.category" }, 'id')
        ]);

        return await enrichItemsWithTaxes(items);
    }

    // =========================================================================
    // 2. Public Catalog Browsing & Full Pipeline Search
    // =========================================================================

    /**
     * Aggregation-based multi-filter search for packages.
     * Matches keywords, price ranges, vendor operational rules, KYC compliance,
     * category verification, and review metrics.
     *
     * @async
     * @param {string} [query=''] - Keyword search term (title, description)
     * @param {number} [minPrice=0] - Minimum selling price boundary
     * @param {number|null} [maxPrice=null] - Maximum selling price boundary
     * @param {string} [sort=''] - Sorting key ('price_asc' | 'price_desc' | default)
     * @returns {Promise<Array<Object>>} Matched package items with vendor location and review metrics
     */
    async getAvailablePackages(query = '', minPrice = 0, maxPrice = null, sort = '') {
        const pipeline = [];
        if (query) pipeline.push({ $match: { $text: { $search: query } } });
        pipeline.push(...getFlattenPackageItemsStages({ extraProjectFields: { vendor: 1 } }));

        // Post-unwind filtering (regex fallback for refined matching)
        const postUnwindFilters = [];
        if (query) {
            const regex = new RegExp(query, 'i');
            postUnwindFilters.push({
                $or: [
                    { "items.title": regex },
                    { "items.description": regex }
                ]
            });
        }
        if (minPrice > 0 || maxPrice !== null) {
            const priceMatch = {};
            if (minPrice > 0) priceMatch.$gte = minPrice;
            if (maxPrice !== null) priceMatch.$lte = maxPrice;

            postUnwindFilters.push({
                $or: [
                    { "items.pricing.sellingPrice": priceMatch },
                ]
            });
        }

        if (postUnwindFilters.length > 0) {
            pipeline.push({
                $match: {
                    $and: postUnwindFilters
                }
            });
        }

        // Price sorting
        if (sort) {
            pipeline.push({
                $addFields: {
                    sortPrice: {
                        $ifNull: ["$items.pricing.sellingPrice", 99999999]
                    }
                }
            });

            if (sort === 'price_asc') {
                pipeline.push({ $sort: { sortPrice: 1 } });
            } else if (sort === 'price_desc') {
                pipeline.push({ $sort: { sortPrice: -1 } });
            }
        }

        const results = await Package.aggregate([
            ...pipeline,
            ...getVendorProfileLookupStages('$vendor'),
            ...this.masterService.getVendorActiveAggregationStages('vendorProfile'),
            ...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'),
            { $match: { "items.isActive": true } },
            getReviewsLookupStage("$items._id"),
            getPackageItemProjectionStage({
                vendorAddressLocation: "$vendorProfile.address.location"
            })
        ]);

        return results;
    }

    /**
     * Unified public discovery and multi-tier filtering method.
     * Delegates to browsePackages helper for fast vendor caching, category permits verification,
     * optional geo-radius filtering, and dual output formatting (flat / categorized).
     *
     * @async
     * @param {Object} [params={}] - Filter and pagination criteria
     * @param {string} [params.query=''] - Search term for title, description, city, or address
     * @param {string} [params.category=''] - Category slug (e.g. 'homestay', 'trekking')
     * @param {number} [params.minPrice=0] - Minimum selling price filter
     * @param {number|null} [params.maxPrice=null] - Maximum selling price filter
     * @param {string} [params.sort=''] - Sorting option ('price_asc' | 'price_desc' | default)
     * @param {number|null} [params.lat=null] - User latitude for geo-distance calculation
     * @param {number|null} [params.lng=null] - User longitude for geo-distance calculation
     * @param {number} [params.radius=50] - Geo-radius cutoff in kilometers
     * @param {string} [params.address=''] - Location keyword to match against vendor/package addresses
     * @param {string|null} [params.userId=null] - Logged-in traveller's ObjectId for wishlist status
     * @param {boolean|string} [params.isFlat=false] - True for flat array, false for category-grouped dictionary
     * @param {number|string} [params.page=1] - 1-indexed page number
     * @param {number|string} [params.limit=100] - Items per page
     * @returns {Promise<Object>} Formatted result object with items, ratings, wishlist flags, and pagination
     */
    async getBrowsePackages(params = {}) {
        return await getBrowsePackages(params);
    }

    // =========================================================================
    // 3. Category Grouping & Geo-Spatial Search
    // =========================================================================

    /**
     * Retrieves available package items grouped by category slug, with applied platform taxes.
     *
     * @async
     * @param {Object} [filters={}] - Filter options
     * @param {string} [filters.query=''] - Keyword search term
     * @param {string} [filters.category=''] - Target category slug filter
     * @param {number} [filters.minPrice=0] - Minimum selling price boundary
     * @param {number|null} [filters.maxPrice=null] - Maximum selling price boundary
     * @param {string} [filters.sort=''] - Sorting option
     * @param {number|null} [filters.lat=null] - Latitude coordinate
     * @param {number|null} [filters.lng=null] - Longitude coordinate
     * @param {number} [filters.radius=50] - Radius cutoff in kilometers
     * @param {string} [filters.address=''] - Address keyword
     * @returns {Promise<Object<string, Array<Object>>>} Dictionary mapping category slug to array of package items
     */
    async getAvailablePackagesByCategory({ query = '', category = '', minPrice = 0, maxPrice = null, sort = '', lat = null, lng = null, radius = 50, address = '' } = {}) {
        const flattened = await this.getAvailablePackages(query, minPrice, maxPrice, sort);
        const categories = await getCategoriesBy({});
        const result = {};

        const taxes = await getTaxConfig();

        categories.forEach(cat => {
            const slug = (cat.slug || '').toLowerCase();
            const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();
            result[slug] = flattened.filter(item => {
                const itemCat = (item.category || '').toLowerCase();
                return itemCat === schemaKey || itemCat === slug;
            }).map(item => ({
                id: item._id,
                title: item.title,
                isActive: item.isActive,
                pricing: applyTaxesToPricing(item.pricing, taxes),
                pricePerNight: item.pricePerNight,
                pricePerPerson: item.pricePerPerson,
                pricePerDay: item.pricePerDay,
                location: item.location || {},
                photos: item.photos?.[0] || "",
                category_name: cat.name || "",
                category_slug: slug,
                category_id: cat._id || "",
                reviews: item.reviews || []
            }));
        });
        return result;
    }

    /**
     * Executes a geo-spatial search pipeline to discover active packages within a radius of given coordinates.
     * Utilizes MongoDB $geoNear on vendor addresses with spherical calculations, joins packages,
     * enforces category compliance, and attaches distance metrics.
     *
     * @async
     * @param {number|string|null} lat - Target latitude coordinate
     * @param {number|string|null} lng - Target longitude coordinate
     * @param {string} [categorySlug=''] - Optional category slug filter
     * @param {number} [radiusKm=50] - Search radius cutoff in kilometers
     * @returns {Promise<Array<Object>>} Array of matching package items with distance metrics
     */
    async searchPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        /**
         * Builds the MongoDB aggregation pipeline for geo-spatial querying.
         * @param {boolean} [useGeoNear=true] - Whether to include $geoNear stage
         * @returns {Array<Object>} Aggregation pipeline stages
         */
        const buildPipeline = (useGeoNear = true) => {
            const pipeline = [];

            // 1. Initial Match or GeoNear on Vendor address
            if (hasCoords && useGeoNear) {
                pipeline.push({
                    $geoNear: {
                        near: { type: "Point", coordinates: [longitude, latitude] },
                        key: "address.location",
                        distanceField: "distance",
                        maxDistance: (parseFloat(radiusKm) || 50) * 1000,
                        spherical: true,
                        query: {
                            status: STATUS.ACTIVE,
                            isOperating: true,
                            isApproved: true
                        }
                    }
                });
                pipeline.push({ $replaceRoot: { newRoot: { vendorProfile: "$$ROOT" } } });
            } else {
                pipeline.push({
                    $match: {
                        status: STATUS.ACTIVE,
                        isOperating: true,
                        isApproved: true
                    }
                });
                pipeline.push({ $addFields: { distance: null } });
                pipeline.push({ $replaceRoot: { newRoot: { vendorProfile: "$$ROOT" } } });
            }

            // 2. Compliance Stages
            pipeline.push(...this.masterService.getVendorActiveAggregationStages('vendorProfile'));

            // 3. Joins & Catalog Unwind
            pipeline.push({
                $lookup: {
                    from: 'packages',
                    let: { vendorId: "$vendorProfile._id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [{ $toString: "$vendor" }, { $toString: "$$vendorId" }]
                                }
                            }
                        }
                    ],
                    as: 'catalog'
                }
            });
            pipeline.push({ $unwind: "$catalog" });

            // 4. Flatten Packages
            pipeline.push(...getFlattenPackageItemsStages({
                catalogPrefix: 'catalog',
                extraProjectFields: { vendorProfile: 1 }
            }));

            // 5. Category Verification & Filtering
            pipeline.push(...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'));

            const finalMatch = { "items.isActive": true };
            if (targetSchemaKey) {
                finalMatch["items.category"] = { $regex: new RegExp(`^${targetSchemaKey}$`, 'i') };
            }
            pipeline.push({ $match: finalMatch });

            // 6. Reviews Lookup
            pipeline.push(getReviewsLookupStage("$items._id"));

            // 7. Final Projection with distance metric
            pipeline.push(getPackageItemProjectionStage({
                distance: "$vendorProfile.distance"
            }));

            return pipeline;
        };

        // Execute primary $geoNear pipeline
        let results = await Vendor.aggregate(buildPipeline(true));

        // Fallback: If $geoNear on Vendor address returned 0 items (e.g. vendor address is [0,0]), fallback to active vendor pipeline
        if (results.length === 0 && hasCoords) {
            results = await Vendor.aggregate(buildPipeline(false));
        }

        return results;
    }
}

export default new PackageService();
