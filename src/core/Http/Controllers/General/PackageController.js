import PackageService from '@/core/Services/General/PackageService.js';
import SearchLog from '@/core/Models/SearchLog.js';
import Category from '@/core/Models/Category.js';
import Wishlist from '@/core/Models/Wishlist.js';
import Review from '@/core/Models/Review.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import { formatPackageItem } from '@/core/Helpers/package.js';

/**
 * PackageController (General/Public Role) - Handles public browsing and search of packages.
 */
class PackageController extends Controller {

    // GET /packages (Public)
    async browsePackages(req) {
        try {
            const url = new URL(req.url);
            const query = url.searchParams.get('q') || '';
            const minPrice = parseInt(url.searchParams.get('minPrice')) || 0;
            const maxPrice = url.searchParams.has('maxPrice') ? parseInt(url.searchParams.get('maxPrice')) : null;
            const sort = url.searchParams.get('sort') || '';
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limit = url.searchParams.get('limit') === 'all' ? 0 : parseInt(url.searchParams.get('limit')) || 10;
            const isFlat = url.searchParams.get('format') === 'flat';

            const packages = await PackageService.getAvailablePackagesByCategory(query, minPrice, maxPrice, sort);
            const wishlistMap = await this._getWishlistMap(req.user?.id);

            let totalCount = 0;

            if (isFlat) {
                let allItems = [];
                for (const items of Object.values(packages)) {
                    if (Array.isArray(items)) {
                        allItems = allItems.concat(items);
                    }
                }
                this._sortItems(allItems, sort);
                totalCount = allItems.length;
                const formattedItems = allItems.map(item => formatPackageItem(item, wishlistMap));

                if (query) await this._logSearch(query, req.user, totalCount);
                const paginatedData = paginateArray(formattedItems, page, limit);
                return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, paginatedData);
            }

            const categoryData = {};
            for (const [slug, items] of Object.entries(packages)) {
                if (Array.isArray(items)) {
                    totalCount += items.length;
                    this._sortItems(items, sort);
                    const formattedItems = items.map(item => formatPackageItem(item, wishlistMap));
                    categoryData[slug] = paginateArray(formattedItems, page, limit);
                }
            }

            if (query) await this._logSearch(query, req.user, totalCount);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, categoryData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async getPackageDetails(req, { params }) {
        try {
            const item = await PackageService.getAvailablePackageItem(params.id);
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

            let isWishlisted = false;
            let wishlistId = null;
            if (req.user?.id) {
                const wishlisted = await Wishlist.findOne({ user: req.user.id, itemId: item._id }).lean();
                if (wishlisted) {
                    isWishlisted = true;
                    wishlistId = wishlisted._id.toString();
                }
            }

            const reviews = await Review.find({ package: item.catalogId, isVisible: true })
                .populate({ path: 'booking', match: { 'item.itemId': params.id } })
                .populate('user', 'name profileImage')
                .lean();

            const itemReviews = reviews.filter(r => r.booking != null)
                .map(r => ({
                    id: r._id,
                    rating: r.rating,
                    comment: r.comment,
                    reply: r.reply,
                    createdAt: r.createdAt,
                    user: r.user ? { name: r.user.name, avatar: r.user.profileImage } : null
                }));

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, {
                ...item,
                wishlist: isWishlisted,
                wishlistId,
                reviews: itemReviews
            });
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
            const wishlistMap = await this._getWishlistMap(req.user?.id);

            const results = {};
            const categories = await Category.find({}).lean();

            categories.forEach(cat => {
                const slug = cat.slug.toLowerCase();
                if (category && slug !== category.toLowerCase()) return;
                const schemaKey = (CATEGORY_MAP[slug] || slug).toLowerCase();
                const categoryItems = rawResults.filter(item => {
                    const itemCat = (item.category || '').toLowerCase();
                    return itemCat === schemaKey || itemCat === slug;
                });

                if (categoryItems.length > 0) {
                    const formatted = categoryItems.map(item => formatPackageItem(item, wishlistMap));
                    results[slug] = paginateArray(formatted, page, limit);
                }
            });

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.NEARBY_FETCHED, results);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // Helper: Wishlist Map Loader (DRY)
    async _getWishlistMap(userId) {
        const wishlistMap = new Map();
        if (userId) {
            const userWishlist = await Wishlist.find({ user: userId }).select('itemId').lean();
            userWishlist.forEach(w => wishlistMap.set(w.itemId.toString(), w._id.toString()));
        }
        return wishlistMap;
    }

    // Helper: Sorting (DRY)
    _sortItems(items, sort) {
        if (!Array.isArray(items)) return items;
        if (sort === 'price_asc') {
            items.sort((a, b) => (a.pricing?.sellingPrice || a.pricing?.basePrice || 99999999) - (b.pricing?.sellingPrice || b.pricing?.basePrice || 99999999));
        } else if (sort === 'price_desc') {
            items.sort((a, b) => (b.pricing?.sellingPrice || b.pricing?.basePrice || 0) - (a.pricing?.sellingPrice || a.pricing?.basePrice || 0));
        } else {
            items.sort((a, b) => (b.id || b._id || '').toString().localeCompare((a.id || a._id || '').toString()));
        }
        return items;
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
