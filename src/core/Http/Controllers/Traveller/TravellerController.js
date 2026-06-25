import SearchLog from '@/core/Models/SearchLog.js';
import Category from '@/core/Models/Category.js';
import Wishlist from '@/core/Models/Wishlist.js';
import PackageService from '@/core/Services/Traveller/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * TravellerController (Traveller Role) - Handles Wishlist, Search History, and preferences.
 */
class TravellerController extends Controller {

    // GET /traveller/recent-searches
    async getRecentSearches(req) {
        try {
            const searches = await SearchLog.find({ user: req.user.id })
                .sort({ lastSearched: -1 })
                .limit(20)
                .lean();

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SEARCH.FETCHED, searches);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // DELETE /traveller/recent-searches
    async clearRecentSearches(req) {
        try {
            await SearchLog.deleteMany({ user: req.user.id });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SEARCH.CLEARED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // GET /traveller/wishlist
    async getWishlist(req) {
        try {
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = parseInt(url.searchParams.get('limit')) || 5;

            const wishlistEntries = await Wishlist.find({ user: req.user.id }).sort({ _id: -1 }).lean();
            if (!wishlistEntries.length) return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.WISHLIST.EMPTY, paginateArray([], page, limit));

            const itemIds = wishlistEntries.map(e => e.itemId.toString());
            const packageItems = await PackageService.getMultiplePackageItems(itemIds);
            const categories = await Category.find({}).lean();

            const itemMap = packageItems.reduce((acc, item) => { acc[item.id.toString()] = item; return acc; }, {});
            const categoryMap = categories.reduce((acc, cat) => { acc[cat.slug.toLowerCase()] = cat; return acc; }, {});

            const items = wishlistEntries.map(entry => {
                const item = itemMap[entry.itemId.toString()];
                if (!item) return null;
                const category = categoryMap[item.category_slug.toLowerCase()];
                return {
                    wishlistId: entry._id,
                    id: item.id,
                    title: item.title,
                    isActive: item.isActive,
                    pricing: item.pricing || {},
                    location: item.location || {},
                    photos: item.photos?.[0] || "",
                    category_name: category?.name || item.category_slug,
                    category_slug: item.category_slug
                };
            }).filter(Boolean);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.WISHLIST.FETCHED, paginateArray(items, page, limit));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /traveller/wishlist
    async addToWishlist(req, { params }) {
        try {
            const itemId = params.itemId;
            if (!itemId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ITEM_ID_REQUIRED);

            const item = await PackageService.getAvailablePackageItem(itemId);
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.WISHLIST.ITEM_NOT_FOUND);

            const wishlistEntry = await Wishlist.findOneAndUpdate(
                { user: req.user.id, itemId: params.itemId },
                { $set: { category: item.category_slug } },
                { upsert: true, returnDocument: 'after' }
            );

            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.WISHLIST.ADDED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    async removeFromWishlist(req, { params }) {
        try {
            await Wishlist.deleteOne({ user: req.user.id, itemId: params.itemId });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.WISHLIST.REMOVED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

const travellerController = new TravellerController();
export default travellerController;
