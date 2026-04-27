import User from '@/core/Models/User.js';
import PackageService from '@/core/Services/General/PackageService.js';
import SearchLog from '@/core/Models/SearchLog.js';
import Category from '@/core/Models/Category.js';
import Wishlist from '@/core/Models/Wishlist.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';

/**
 * PackageController (General/Public Role) - Handles public browsing and search of packages.
 */
class PackageController extends Controller {

  // GET /packages (Public)
  async browsePackages(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get('q') || '';
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = url.searchParams.get('limit') === 'all' ? 0 : parseInt(url.searchParams.get('limit')) || 10;

      const packages = await PackageService.getAvailablePackagesByCategory(query);

      const wishlistSet = new Set();
      if (req.user?.id) {
        const userWishlist = await Wishlist.find({ user: req.user.id }).select('itemId').lean();
        userWishlist.forEach(w => wishlistSet.add(w.itemId.toString()));
      }

      const categoryData = {};
      for (const [slug, items] of Object.entries(packages)) {
        if (Array.isArray(items)) {
          // Sort items by creation (descending ID as proxy for newest first)
          items.sort((a, b) => (b.id || b._id).toString().localeCompare((a.id || a._id).toString()));

          const itemsWithWishlist = items.map(item => ({
            ...item,
            wishlist: wishlistSet.has((item.id || item._id).toString())
          }));

          categoryData[slug] = paginateArray(itemsWithWishlist, page, limit);
        }
      }

      if (query) {
        const total = Object.values(packages).flat().length;
        await this._logSearch(query, req.user, total);
      }

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED || "Packages retrieved successfully", categoryData);
    } catch (error) {
      console.error("[PackageController] browsePackages error:", error);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  async getPackageDetails(req, { params }) {
    try {
      const item = await PackageService.getAvailablePackageItem(params.id);
      if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

      let isWishlisted = false;
      if (req.user?.id) {
        const wishlisted = await Wishlist.findOne({ user: req.user.id, itemId: item._id }).lean();
        isWishlisted = !!wishlisted;
      }

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, { ...item, wishlist: isWishlisted });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  async searchNearby(req) {
    try {
      const url = new URL(req.url);
      const { lat, lng, category, radius } = Object.fromEntries(url.searchParams.entries());
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = url.searchParams.get('limit') === 'all' ? 0 : parseInt(url.searchParams.get('limit')) || 10;

      const rawResults = await PackageService.searchPackages(lat, lng, category, radius || 50);

      const config = await getAppConfig();
      const gst = config.tax?.gst || 0;
      const serviceTax = config.tax?.service_tax || 0;

      const results = {};
      const wishlistSet = new Set();
      if (req.user?.id) {
        const userWishlist = await Wishlist.find({ user: req.user.id }).select('itemId').lean();
        userWishlist.forEach(w => wishlistSet.add(w.itemId.toString()));
      }

      const categories = await Category.find({}).lean();
      categories.forEach(cat => {
        const slug = cat.slug.toLowerCase();
        if (category && slug !== category.toLowerCase()) return;
        const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();
        const categoryItems = rawResults.filter(item => item.category.toLowerCase() === schemaKey || item.category.toLowerCase() === slug);

        if (categoryItems.length > 0) {
          const formatted = categoryItems.map(item => ({
            id: item._id,
            title: item.title,
            isActive: item.isActive,
            pricing: {
              ...(item.pricing || {}),
              gst: gst,
              serviceTax: serviceTax
            },
            location: item.location || {},
            photos: item.photos?.[0] || "",
            category_name: cat.name,
            category_slug: slug,
            wishlist: wishlistSet.has(item._id.toString())
          }));
          results[slug] = paginateArray(formatted, page, limit);
        }
      });

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.NEARBY_FETCHED, results);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  async _logSearch(query, user, resultsCount) {
    if (!query) return;
    try {
      const q = query.toLowerCase();
      await SearchLog.findOneAndUpdate({ query: q, user: null }, { $inc: { count: 1 }, $set: { lastSearched: new Date(), resultsCount } }, { upsert: true, returnDocument: 'after' });
      if (user?.id) await SearchLog.findOneAndUpdate({ query: q, user: user.id }, { $inc: { count: 1 }, $set: { lastSearched: new Date(), resultsCount } }, { upsert: true, returnDocument: 'after' });
    } catch (e) { }
  }
}

const packageController = new PackageController();
export default packageController;
