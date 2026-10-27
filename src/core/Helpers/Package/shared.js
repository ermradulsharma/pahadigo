import mongoose from 'mongoose';

export function schemaKey(name) {
    return name === 'Bike/Scooter Rental' ? 'vehicleRental' : name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join('');
}

export function sortItems(pipeline, sort, options = {}) {
    const { priceField = "items.pricing.sellingPrice", idField = "items._id", ratingField = "ratingStats.average" } = options;
    if (sort === 'price_asc' || sort === 'price_desc') {
        pipeline.push({
            $sort: { [priceField]: sort === 'price_asc' ? 1 : -1 }
        });
    } else if (sort === 'oldest' || sort === 'newest') {
        pipeline.push({
            $sort: { [idField]: sort === 'oldest' ? 1 : -1 }
        });
    } else if (sort === 'rating_asc' || sort === 'rating_desc') {
        pipeline.push({
            $sort: { [ratingField]: sort === 'rating_asc' ? 1 : -1 }
        });
    }
}

/**
 * Common Reviews & Ratings Lookup Stage for MongoDB Aggregation Pipeline
 * Computes average rating and review count for any item
 *
 * @param {string} itemIdField - Item ID field name (e.g., "items._id" or "item.itemId")
 * @param {string} [asField="ratingStats"]   - Output alias field name
 * @returns {Object} MongoDB $lookup stage
 */
export function itemsReviews(itemIdField = "$items._id", asField = "ratingStats") {
    return {
        $lookup: {
            from: 'reviews',
            let: { itemId: itemIdField },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$item.itemId", "$$itemId"] },
                                { $eq: ["$isVisible", true] }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        average: { $avg: "$rating" },
                        count: { $sum: 1 }
                    }
                }
            ],
            as: asField
        }
    };
}

/**
 * Wishlist Resolution Lookup Stage for Authenticated Travellers
 * 
 * @param {Array} pipeline - MongoDB Aggregation Pipeline
 * @param {string} userId   - Logged-in User's ObjectId
 * @param {string} [asField="userWishlist"] - Output field name
 * @returns {boolean} hasUserId (true if valid user and lookup pushed)
 */
export function itemsWishlist(pipeline, userId, itemIdField = "$items._id", asField = 'userWishlist') {
    const hasUserId = Boolean(userId && mongoose.Types.ObjectId.isValid(userId));
    if (hasUserId) {
        pipeline.push({
            $lookup: {
                from: 'wishlists',
                let: { itemId: itemIdField },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ["$itemId", "$$itemId"] }
                                ]
                            }
                        }
                    },
                    { $project: { _id: 1 } },
                    { $limit: 1 }
                ],
                as: asField
            }
        });
    }
    return hasUserId;
}

/**
 * Final Projection Stage for Package Items
 * Formats the final package document structure with rating and wishlist status
 * 
 * @param {boolean} [hasUserId=false] - Whether traveller is logged in
 * @returns {Object} MongoDB $project stage
 */
export function itemsProject(hasUserId = false) {
    return {
        $project: {
            _id: "$items._id",
            id: "$items._id",
            vendor: "$vendor",
            title: "$items.title",
            isActive: "$items.isActive",
            pricing: "$items.pricing",
            address: "$items.location.address",
            location: "$items.location",
            photos: "$items.photos",
            category_slug: "$items.category_slug",
            category_name: "$items.category_name",
            category_id: "$items.category_id",
            rating: { $arrayElemAt: ["$ratingStats", 0] },
            wishlist: hasUserId ? { $gt: [{ $size: { $ifNull: ["$userWishlist", []] } }, 0] } : { $literal: false }
        }
    };
}


export function paginateItems(items = [], options = {}) {
    const { page = 1, limit = 10 } = options;

    const total = items.length;
    const totalPages = limit > 0 ? (Math.ceil(total / limit) || 0) : 1;

    const skip = (page - 1) * (limit || total);
    const take = limit > 0 ? limit : total;

    const paginated = items.slice(skip, skip + take);

    return {
        items: paginated,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
}

export function buildEmptyResult(isFlat = false, options = {}) {
    const result = isFlat ? paginateItems([], options) : {};
    return result;
}

export default { schemaKey, sortItems, itemsReviews, itemsWishlist, itemsProject, paginateItems, buildEmptyResult };


