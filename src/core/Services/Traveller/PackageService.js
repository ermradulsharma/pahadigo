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

/**
 * PackageService (Traveller Role)
 * Focuses on retrieval, search, and availability for the customer-facing side.
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

    async getAvailablePackages(query = '') {
        const regex = new RegExp(query, 'i');
        const results = await Package.aggregate([
            ...getFlattenPackageItemsStages({ extraProjectFields: { vendor: 1 } }),
            ...(query ? [{
                $match: {
                    $or: [
                        { "items.title": regex },
                        { "items.description": regex }
                    ]
                }
            }] : []),
            ...getVendorProfileLookupStages('$vendor'),
            ...this.masterService.getVendorActiveAggregationStages('vendorProfile'),
            ...this.masterService.getCategoryVerificationStages('items', 'vendorProfile._id'),
            { $match: { "items.isActive": true } },
            getReviewsLookupStage("$items._id"),
            getPackageItemProjectionStage()
        ]);

        return results;
    }

    async getAvailablePackagesByCategory(query = '') {
        const flattened = await this.getAvailablePackages(query);
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
