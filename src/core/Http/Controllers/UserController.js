import User from '@/models/User.js';
import PackageService from '@/services/PackageService.js';
import SearchLog from '@/models/SearchLog.js';
import Category from '@/models/Category.js';
import Wishlist from '@/models/Wishlist.js';
import { CATEGORY_MAP } from '@/constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class UserController {

    // Log search helper
    async _logSearch(query, user, resultsCount) {
        if (!query) return;
        try {
            const q = query.toLowerCase();
            // Global popularity
            await SearchLog.findOneAndUpdate(
                { query: q, user: null },
                { $inc: { count: 1 }, $set: { lastSearched: new Date(), resultsCount } },
                { upsert: true }
            );
            // User history
            if (user && user.id) {
                await SearchLog.findOneAndUpdate(
                    { query: q, user: user.id },
                    { $inc: { count: 1 }, $set: { lastSearched: new Date(), resultsCount } },
                    { upsert: true }
                );
            }
        } catch (e) { }
    }

    // GET /traveller/packages (or public)
    async browsePackages(req) {
        try {
            const url = new URL(req.url);
            const query = url.searchParams.get('q') || '';
            const packages = await PackageService.getAvailablePackagesByCategory(query);

            if (query) {
                const totalResults = Object.values(packages).flat().length;
                await this._logSearch(query, req.user, totalResults);
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, packages);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /api/packages/:id (Single Item)
    async getPackageDetails(req, { params }) {
        try {
            const { id } = params;
            const item = await PackageService.getAvailablePackageItem(id);

            if (!item) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND, {});
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, item);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /api/packages/search?lat=...&lng=...&category=...
    async searchNearby(req) {
        try {
            const url = new URL(req.url);
            const lat = url.searchParams.get('lat');
            const lng = url.searchParams.get('lng');
            const category = url.searchParams.get('category');
            const radius = url.searchParams.get('radius');

            if (!lat || !lng) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "Latitude and Longitude are required", {});
            }

            const flattened = await PackageService.searchNearbyPackages(lat, lng, category, radius || 50);

            // Logging search query (if category is used as query)
            if (category) {
                await this._logSearch(category, req.user, flattened.length);
            }

            // Categorize the results to match /api/packages response structure
            const categories = await Category.find({}).lean();
            const results = {};

            categories.forEach(cat => {
                const slug = (cat.slug || '').toLowerCase();
                if (category && slug !== category.toLowerCase()) return;

                const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();

                results[slug] = flattened.filter(item => {
                    const itemCat = (item.category || '').toLowerCase();
                    return itemCat === schemaKey || itemCat === slug;
                }).map(item => ({
                    id: item._id,
                    title: item.title,
                    isActive: item.isActive,
                    pricing: item.pricing || {},
                    location: item.location || {},
                    photos: item.photos?.[0] || "",
                    category_name: cat.name || "",
                    category_slug: slug,
                    category_id: cat._id || ""
                }));
            });

            return successResponse(HTTP_STATUS.OK, "Nearby packages retrieved", results);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // --- Traveller Recent Searches ---

    // GET /traveller/recent-searches
    async getRecentSearches(req) {
        try {
            const searches = await SearchLog.find({ user: req.user.id })
                .sort({ lastSearched: -1 })
                .limit(20)
                .lean();

            return successResponse(HTTP_STATUS.OK, "Recent searches retrieved", searches);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // DELETE /traveller/recent-searches
    async clearRecentSearches(req) {
        try {
            await SearchLog.deleteMany({ user: req.user.id });
            return successResponse(HTTP_STATUS.OK, "Search history cleared", {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // --- Traveller Wishlist ---

    // GET /traveller/wishlist
    async getWishlist(req) {
        try {
            const wishlistEntries = await Wishlist.find({ user: req.user.id }).lean();

            // Populate the full package item details for each wishlist entry
            const items = [];
            for (const entry of wishlistEntries) {
                const item = await PackageService.getAvailablePackageItem(entry.itemId.toString());
                if (item) {
                    const category = await Category.findOne({ slug: item.category }).lean();
                    items.push({
                        wishlistId: entry._id,
                        id: item._id,
                        title: item.title,
                        isActive: item.isActive,
                        pricing: item.pricing || {},
                        location: item.location || {},
                        photos: item.photos?.[0] || "",
                        category_name: category?.name || item.category,
                        category_slug: item.category,
                        category_id: category?._id || ""
                    });
                }
            }

            return successResponse(HTTP_STATUS.OK, "Wishlist retrieved", items);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // POST /traveller/wishlist
    async addToWishlist(req) {
        try {
            const { itemId, category } = req.validData || {};
            if (!itemId) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "Item ID is required", {});
            }

            const item = await PackageService.getAvailablePackageItem(itemId);
            if (!item) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, "Package item not found", {});
            }

            // Log the action for analytics
            // (Wait: No need to log here unless desired)

            const wishlistEntry = await Wishlist.findOneAndUpdate(
                { user: req.user.id, itemId },
                { $set: { category: category || item.category } },
                { upsert: true, returnDocument: 'after' }
            );

            return successResponse(HTTP_STATUS.CREATED, "Added to wishlist", wishlistEntry);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // DELETE /traveller/wishlist/:itemId
    async removeFromWishlist(req, { params }) {
        try {
            const { itemId } = params;
            await Wishlist.deleteOne({ user: req.user.id, itemId });
            return successResponse(HTTP_STATUS.OK, "Removed from wishlist", {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }
}


const userController = new UserController();
export default userController;
