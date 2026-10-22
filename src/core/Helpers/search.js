/**
 * @file search.js
 * @module core/Helpers/search
 * @description Centralized query string parser, sanitizer, and standardized package item formatter.
 */

import { APP_DETAILS } from '@/core/Constants/index.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper.js';

/**
 * Parses and sanitizes URL search parameters into strongly-typed query options.
 * Handles both relative paths and absolute URLs safely.
 *
 * @param {string|URL} urlStr - The full request URL, relative path, or URL object
 * @returns {{
 *   url: URL,
 *   page: number,
 *   limit: number,
 *   minPrice: number,
 *   maxPrice: number|null,
 *   isFlat: boolean,
 *   sort: string,
 *   query: string,
 *   category: string,
 *   lat: number|null,
 *   lng: number|null,
 *   radius: number,
 *   address: string
 * }} Sanitized query options
 */
export function parseQuery(urlStr) {
    const baseUrl = APP_DETAILS?.APP_URL || 'https://pahadigo.co.in' || 'https://tripdhara.com' || 'http://localhost:3000';
    const url = urlStr instanceof URL ? urlStr : new URL(urlStr || '', baseUrl);

    // Pagination bounds
    const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam === 'all' ? 0 : Math.max(0, parseInt(limitParam, 10) || 10);

    // Price range bounds
    const minPriceRaw = url.searchParams.get('minPrice');
    const minPrice = minPriceRaw !== null && !isNaN(parseInt(minPriceRaw, 10)) ? Math.max(0, parseInt(minPriceRaw, 10)) : 0;

    const maxPriceRaw = url.searchParams.get('maxPrice');
    const maxPrice = maxPriceRaw !== null && !isNaN(parseInt(maxPriceRaw, 10)) ? Math.max(0, parseInt(maxPriceRaw, 10)) : null;

    // Output format & sort options
    const format = (url.searchParams.get('format') || '').toLowerCase();
    const isFlat = format === 'flat' ? true : false;
    const sort = (url.searchParams.get('sort') || '').trim();

    // Search, category & location filters
    const query = (url.searchParams.get('q') || url.searchParams.get('query') || '').trim();
    const category = (url.searchParams.get('category') || '').trim().toLowerCase();

    // Coordinates & Radius (numeric parsing)
    const rawLat = url.searchParams.get('lat') || url.searchParams.get('latitude');
    const lat = rawLat !== null && !isNaN(parseFloat(rawLat)) ? parseFloat(rawLat) : null;

    const rawLng = url.searchParams.get('lng') || url.searchParams.get('longitude');
    const lng = rawLng !== null && !isNaN(parseFloat(rawLng)) ? parseFloat(rawLng) : null;

    const radiusRaw = url.searchParams.get('radius');
    const radius = radiusRaw !== null && !isNaN(parseFloat(radiusRaw)) ? parseFloat(radiusRaw) : 50;

    const address = (url.searchParams.get('address') || url.searchParams.get('city') || url.searchParams.get('location') || '').trim();

    return {
        url,
        page,
        limit,
        minPrice,
        maxPrice,
        isFlat,
        sort,
        query,
        category,
        lat,
        lng,
        radius,
        address
    };
}

/**
 * Standardized package item formatter for search, browsing, and vendor inventory.
 *
 * @param {Object} item - Raw package subdocument or item object
 * @param {Object} [categoryInfo={}] - Category metadata ({ name, id })
 * @param {Map|Object} [reviewStats=null] - Review statistics Map (itemId -> { sum, count }) or rating object ({ average, count })
 * @param {Object} [extraFields={}] - Optional additional fields like wishlist
 * @returns {Object|null} Standardized package item representation
 */
export function formatPackageItem(item, categoryInfo = {}, reviewStats = null, extraFields = {}) {
    if (!item) return null;

    const itemId = (item._id || item.id)?.toString() || '';
    const categoryName = categoryInfo?.name || categoryInfo?.category_name || item.category_name || '';
    const categoryId = categoryInfo?.id || categoryInfo?._id || categoryInfo?.category_id || item.category_id || '';

    // Calculate rating stats
    let average = 0;
    let count = 0;

    if (reviewStats instanceof Map) {
        const stat = reviewStats.get(itemId);
        if (stat) {
            count = stat.count || 0;
            average = count > 0 ? Math.round((stat.sum / count) * 10) / 10 : 0;
        }
    } else if (reviewStats && typeof reviewStats === 'object') {
        average = reviewStats.average || 0;
        count = reviewStats.count || 0;
    } else if (item.reviews) {
        average = item.reviews.average || 0;
        count = item.reviews.count || 0;
    }

    // Single photo / thumbnail extraction
    const photos = typeof item.photos?.[0] === 'string'
        ? item.photos[0]
        : (item.photos?.[0]?.url || (typeof item.photos === 'string' ? item.photos : ''));

    // Coordinates resolution
    const coords = item.location && typeof item.location === 'object' && Array.isArray(item.location.coordinates)
        ? item.location.coordinates
        : getLocationPoint(item?.location);

    return {
        id: item._id || item.id,
        title: item.title || item.name || '',
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true,
        pricing: {
            basePrice: item.pricing?.basePrice || 0,
            gst: item.pricing?.gst || 18,
            sellingPrice: item.pricing?.sellingPrice || 0,
        },
        address: item?.location?.address || item?.address || '',
        location: coords,
        photos,
        category_name: categoryName,
        category_id: categoryId ? categoryId.toString() : '',
        rating: {
            average,
            count
        },
        ...(extraFields.wishlist !== undefined ? { wishlist: Boolean(extraFields.wishlist) } : {})
    };
}

export default {
    parseQuery,
    formatPackageItem
};