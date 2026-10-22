import mongoose from 'mongoose';
import Package from '@/core/Models/Package.js';
import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { STATUS } from '@/core/Constants/index.js';
import MasterService from '@/core/Services/MasterService.js';
import { getPackageItemById } from '@/core/Helpers/queryHelpers.js';
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
 * Focuses on public retrieval, search, and availability.
 */
class PackageService {
    constructor(masterService = MasterService) {
        this.masterService = masterService;
    }

    async getPackageById(id) {
        return await Package.findById(id);
    }

    async getAvailablePackageItem(itemId) {
        return await getItemDetailsPayload(itemId, this.masterService);
    }

    async getPackageItem(itemId) {
        return await getPackageItemById(itemId);
    }

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

    async getAvailablePackages(query = '', minPrice = 0, maxPrice = null, sort = '') {
        const pipeline = [];
        if (query) pipeline.push({ $match: { $text: { $search: query } } });
        pipeline.push(...getFlattenPackageItemsStages({ extraProjectFields: { vendor: 1 } }));

        // Post-unwind filtering (if text search was too broad or needs regex refinement)
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

        // Sorting
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
     * Complete browsing and filtering logic for public packages.
     * Delegated to browsePackages helper for clean modularity.
     */
    async getBrowsePackages(params = {}) {
        return await getBrowsePackages(params);
    }

    async getAvailablePackagesByCategory({ query = '', category = '', minPrice = 0, maxPrice = null, sort = '', lat = null, lng = null, radius = 50, address = '' } = {}) {
        const flattened = await this.getAvailablePackages(query, minPrice, maxPrice, sort);
        const categories = await Category.find({}).lean();
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

    async searchPackages(lat, lng, categorySlug = '', radiusKm = 50) {
        const { latitude, longitude, hasCoords } = normalizeCoordinates(lat, lng);
        const targetSchemaKey = categorySlug ? (CATEGORY_MAP[categorySlug] || categorySlug).toLowerCase() : null;

        const buildPipeline = (useGeoNear = true) => {
            const pipeline = [];

            // 1. Initial Match or GeoNear
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

            // 3. Joins & Flattening
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

            // 5. Verification & Filtering
            pipeline.push(...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'));

            const finalMatch = { "items.isActive": true };
            if (targetSchemaKey) {
                finalMatch["items.category"] = { $regex: new RegExp(`^${targetSchemaKey}$`, 'i') };
            }
            pipeline.push({ $match: finalMatch });

            // 6. Lookup Reviews
            pipeline.push(getReviewsLookupStage("$items._id"));

            // 7. Final Projection
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
