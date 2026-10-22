/**
 * @file PackageController.js
 * @module core/Http/Controllers/General/PackageController
 * @description HTTP Controller handling public browsing, keyword search, geo-exploration, and package detail retrieval.
 *
 * Exposes Endpoints:
 * 1. GET /api/packages         -> browsePackages(req)       : Universal browsing with multi-tier filters & pagination
 * 2. GET /api/packages/:id     -> getPackageDetails(req)    : Full details for a specific package item with wishlist state
 * 3. GET /api/packages/nearby  -> searchNearby(req)         : Radius-based geo-spatial search grouped by category
 *
 * Core Architectural Highlights:
 * - Parameter Normalization    : Robust URL parsing with sanitization for pagination, price ranges, coords, and sort keys.
 * - Service Delegation         : Delegates complex aggregation & compliance checks to PackageService & browsePackages helper.
 * - Search Analytics          : Asynchronous logging of search queries to SearchLog without blocking the response.
 * - Wishlist Resolution        : Context-aware wishlist resolution for authenticated travellers.
 * - Standardized Responses     : Employs base Controller methods (this.success, this.error) for uniform API responses.
 */

import PackageService from '@/core/Services/General/PackageService.js';
import SearchLog from '@/core/Models/SearchLog.js';
import Category from '@/core/Models/Category.js';
import Wishlist from '@/core/Models/Wishlist.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { paginateArray } from '@/core/Helpers/queryUtils.js';
import { getBy, getManyBy, getCategoriesBy } from '@/core/Helpers/queryHelpers.js';
import Controller from '@/core/Controllers/Controller.js';
import { formatPackageItem } from '@/core/Helpers/package.js';
import { getBrowsePackages } from '@/core/Helpers/browsePackages.js';

/**
 * PackageController (General / Public Role)
 * Manages public package discovery and search endpoints.
 */
class PackageController extends Controller {

    // =========================================================================
    // 1. Parameter Normalization & Parsing
    // =========================================================================

    /**
     * Extracts, sanitizes, and normalizes pagination and filter query parameters from the request URL.
     *
     * @private
     * @param {string} urlStr - Full request URL string (e.g. req.url)
     * @returns {Object} Normalized filter parameters
     * @property {URL} url - Parsed URL object
     * @property {number} page - 1-indexed page number (default: 1)
     * @property {number} limit - Items per page (default: 100, 0 for all)
     * @property {number} minPrice - Minimum selling price (default: 0)
     * @property {number|null} maxPrice - Maximum selling price or null
     * @property {boolean} isFlat - True for flat array output, false for category-grouped dictionary
     * @property {string} sort - Sort order key ('price_asc' | 'price_desc' | '')
     * @property {string} query - Keyword search term (title, description, location)
     * @property {string} category - Category filter slug
     * @property {string|null} lat - Latitude coordinate string or null
     * @property {string|null} lng - Longitude coordinate string or null
     * @property {number} radius - Geo-search radius in kilometers (default: 50)
     * @property {string} address - Address or city filter string
     */
    _parsePagination(urlStr) {
        const url = new URL(urlStr);

        // Pagination bounds
        const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);
        const limit = url.searchParams.get('limit') === 'all' ? 0 : Math.max(0, parseInt(url.searchParams.get('limit'), 10) || 100);

        // Price range bounds
        const minPrice = !isNaN(parseInt(url.searchParams.get('minPrice'), 10)) ? parseInt(url.searchParams.get('minPrice'), 10) : 0;
        const maxPrice = (url.searchParams.has('maxPrice') && !isNaN(parseInt(url.searchParams.get('maxPrice'), 10)))
            ? parseInt(url.searchParams.get('maxPrice'), 10)
            : null;

        // Output format & sort options
        const format = (url.searchParams.get('format') || '').toLowerCase();
        const isFlat = format === 'flat' ? true : false;
        const sort = url.searchParams.get('sort') || '';

        // Search, category & location filters
        const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
        const category = url.searchParams.get('category') || '';
        const lat = url.searchParams.get('lat') || url.searchParams.get('latitude') || null;
        const lng = url.searchParams.get('lng') || url.searchParams.get('longitude') || null;
        const radius = parseFloat(url.searchParams.get('radius')) || 50;
        const address = url.searchParams.get('address') || url.searchParams.get('city') || url.searchParams.get('location') || '';

        return { url, page, limit, minPrice, maxPrice, isFlat, sort, query, category, lat, lng, radius, address };
    }

    // =========================================================================
    // 2. Public Package Discovery Endpoint
    // =========================================================================

    /**
     * GET /api/packages
     * Main public package discovery API.
     * Enforces active vendor verification, KYC compliance, non-expired category permits,
     * optional geo-radius filtering, pricing ranges, search queries, and pagination.
     *
     * @async
     * @param {Request} req - Next.js / Node HTTP Request object
     * @returns {Promise<Response>} HTTP Response with package catalog and pagination metadata
     */
    async browsePackages(req) {
        try {
            const { page, limit, minPrice, maxPrice, isFlat, sort, query, category, lat, lng, radius, address } = this._parsePagination(req.url);
            const packages = await getBrowsePackages({ query, category, minPrice, maxPrice, sort, lat, lng, radius, address, userId: req.user?.id, page, limit, isFlat });
            if (query) {
                const totalCount = isFlat ? (packages?.pagination?.total || 0) : Object.values(packages || {}).reduce((acc, cat) => acc + (cat?.pagination?.total || 0), 0);
                await this._logSearch(query, req.user, totalCount);
            }
            if (isFlat) return this.paginatedSuccess(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, packages.items || packages.data || [], packages.pagination || {});
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, packages);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // =========================================================================
    // 3. Single Package Item Detail Endpoint
    // =========================================================================

    /**
     * GET /api/packages/:id
     * Retrieves full, populated details for a single package subdocument item by its ObjectId.
     * Validates vendor operational status and non-expired category compliance.
     * Resolves wishlist state for authenticated travellers.
     *
     * @async
     * @param {Request} req - HTTP Request object (may include req.user if authenticated)
     * @param {Object} context - Route handler context containing route parameters
     * @param {Object} context.params - Dynamic route parameters ({ id: string })
     * @returns {Promise<Response>} HTTP Response with package details or 404 Not Found
     */
    async getPackageDetails(req, { params }) {
        try {
            const itemId = params?.id;
            if (!itemId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

            // Retrieve package item with vendor & category compliance checks via PackageService
            const item = await PackageService.getAvailablePackageItem(itemId);
            if (!item) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

            // Resolve wishlist state for logged-in user via queryHelpers
            let isWishlisted = false;
            let wishlistId = null;

            if (req.user?.id) {
                const wishlisted = await getBy(Wishlist, { user: req.user.id, itemId: item._id }, '_id');
                if (wishlisted) {
                    isWishlisted = true;
                    wishlistId = wishlisted._id.toString();
                }
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, {
                ...item,
                wishlist: isWishlisted,
                wishlistId
            });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // =========================================================================
    // 4. Geo-Spatial Nearby Package Search Endpoint
    // =========================================================================

    /**
     * GET /api/packages/nearby
     * Performs a geo-spatial search around specific coordinates and groups results by category.
     *
     * @async
     * @param {Request} req - HTTP Request object containing lat, lng, radius, and category in query params
     * @returns {Promise<Response>} HTTP Response with nearby packages grouped by category
     */
    async searchNearby(req) {
        try {
            const { url, page, limit } = this._parsePagination(req.url);
            const { lat, lng, category, radius } = Object.fromEntries(url.searchParams.entries());

            // Execute service-level geo-spatial pipeline search
            const rawResults = await PackageService.searchPackages(lat, lng, category, radius || 50);
            const wishlistMap = await this._getWishlistMap(req.user?.id);

            const results = {};
            const categories = await getCategoriesBy({});

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

    // =========================================================================
    // 5. Internal Helper Utilities
    // =========================================================================

    /**
     * Loads a lookup Map of all item IDs saved in the traveller's wishlist.
     *
     * @private
     * @async
     * @param {string|null} userId - Authenticated user's ObjectId string
     * @returns {Promise<Map<string, string>>} Map where key = itemId and value = wishlistId
     */
    async _getWishlistMap(userId) {
        const wishlistMap = new Map();
        if (userId) {
            const userWishlist = await getManyBy(Wishlist, { user: userId }, 'itemId');
            userWishlist.forEach(w => {
                if (w.itemId) wishlistMap.set(w.itemId.toString(), w._id.toString());
            });
        }
        return wishlistMap;
    }

    /**
     * Sorts an array of package items in-place according to price or identifier.
     *
     * @private
     * @param {Array<Object>} items - Array of package items to sort
     * @param {string} sort - Sort option ('price_asc' | 'price_desc' | default)
     * @returns {Array<Object>} Sorted items array
     */
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

    /**
     * Asynchronously records search terms in the SearchLog collection for platform analytics.
     * Non-blocking operation: errors are gracefully caught and ignored.
     *
     * @private
     * @async
     * @param {string} query - Raw search keyword
     * @param {Object|null} user - Authenticated user object if available
     * @param {number} resultsCount - Number of packages found for this query
     * @returns {Promise<void>}
     */
    async _logSearch(query, user, resultsCount) {
        if (!query || typeof query !== 'string') return;
        try {
            const q = query.trim().toLowerCase();
            const now = new Date();

            // Record general aggregated search count
            await SearchLog.findOneAndUpdate(
                { query: q, user: null },
                { $inc: { count: 1 }, $set: { lastSearched: now, resultsCount } },
                { upsert: true, returnDocument: 'after' }
            );

            // Record user-specific search history if authenticated
            if (user?.id) {
                await SearchLog.findOneAndUpdate(
                    { query: q, user: user.id },
                    { $inc: { count: 1 }, $set: { lastSearched: now, resultsCount } },
                    { upsert: true, returnDocument: 'after' }
                );
            }
        } catch (e) {
            // Intentionally silent: search logging failure should never impact user requests
        }
    }
}

const packageController = new PackageController();
export default packageController;
