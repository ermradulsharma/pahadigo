import SearchLog from '@/core/Models/SearchLog.js';
import Category from '@/core/Models/Category.js';
import Wishlist from '@/core/Models/Wishlist.js';
import PackageService from '@/core/Services/Traveller/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper';
import { parseQuery } from '@/core/Helpers/search';
import getWishlistPackages from '@/core/Helpers/Package/wishlistPackage';

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
            const userId = req.user?.id;
            const options = parseQuery(req.url);
            const result = await getWishlistPackages({ userId, ...options });

            const isEmpty = !result || (Array.isArray(result.items) && result.items.length === 0);
            const message = isEmpty ? RESPONSE_MESSAGES.WISHLIST.EMPTY : RESPONSE_MESSAGES.WISHLIST.FETCHED;

            if (result && result.pagination) {
                return this.paginatedSuccess(HTTP_STATUS.OK, message, result.items, result.pagination);
            }
            return this.success(HTTP_STATUS.OK, message, result);
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
