/**
 * @file search.js
 * @module core/Helpers/search
 * @description Centralized query string parser and sanitizer for pagination, price, geo, and category filters.
 */

import { APP_DETAILS } from '@/core/Constants/index.js';

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

export default parseQuery;