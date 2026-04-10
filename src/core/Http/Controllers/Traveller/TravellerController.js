import SearchLog from '@/models/SearchLog.js';
import Category from '@/models/Category.js';
import Wishlist from '@/models/Wishlist.js';
import PackageService from '@/services/Traveller/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { paginateArray } from '@/helpers/queryUtils.js';
import Controller from '@/controllers/Controller.js';

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

      return this.success(HTTP_STATUS.OK, "Recent searches retrieved", searches);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // DELETE /traveller/recent-searches
  async clearRecentSearches(req) {
    try {
      await SearchLog.deleteMany({ user: req.user.id });
      return this.success(HTTP_STATUS.OK, "Search history cleared");
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
      if (!wishlistEntries.length) return this.success(HTTP_STATUS.OK, "Wishlist is empty", paginateArray([], page, limit));

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

      return this.success(HTTP_STATUS.OK, "Wishlist retrieved", paginateArray(items, page, limit));
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // POST /traveller/wishlist
  async addToWishlist(req) {
    try {
      const body = req.validData || req.jsonBody || {};
      if (!body.itemId) return this.error(HTTP_STATUS.BAD_REQUEST, "Item ID is required");

      const item = await PackageService.getAvailablePackageItem(body.itemId);
      if (!item) return this.error(HTTP_STATUS.NOT_FOUND, "Package item not found");

      const wishlistEntry = await Wishlist.findOneAndUpdate(
        { user: req.user.id, itemId: body.itemId },
        { $set: { category: body.category || item.category } },
        { upsert: true, returnDocument: 'after' }
      );

      return this.success(HTTP_STATUS.CREATED, "Added to wishlist", wishlistEntry);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  async removeFromWishlist(req, { params }) {
    try {
      await Wishlist.deleteOne({ user: req.user.id, itemId: params.itemId });
      return this.success(HTTP_STATUS.OK, "Removed from wishlist");
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

const travellerController = new TravellerController();
export default travellerController;
