/**
 * @file vendorPackage.js
 * @module core/Helpers/vendorPackage
 * @description Unified, lightweight engine for retrieving and formatting a vendor's package inventory.
 * Directly aligned with Vendor (VendorSchema) and Package (VendorPackageSchema) models.
 *
 * Core Logic:
 * 1. Resolve Vendor: Fetch vendor via userId (or vendorId) to get vendor profile and authorized vendor.category array.
 * 2. Check Catalog: Query Package model by { user: userId, vendor: vendorId }. If none, return empty.
 * 3. CamelCase Mapping: Category names map directly to Package schema keys in camelCase
 *    (e.g., 'Homestay' -> homestay, 'Bungee Jumping' -> bungeeJumping, 'Chardham Tour' -> chardhamTour),
 *    with only 1 exception: 'Bike/Scooter Rental' -> vehicleRental.
 * 4. Iterate vendor.category: Extract, filter, and format items directly from catalog[schemaKey].
 */

import { getPackageBy, getBusinessById, getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';
import { getLocationPoint } from '@/core/Helpers/addressHelper.js';

/**
 * Unified function to retrieve a vendor's package inventory.
 *
 * @async
 * @param {Object} [params={}] - Query and filter criteria
 * @param {string} [params.userId] - Authenticated user's ObjectId
 * @param {string} [params.vendorId] - Vendor ObjectId (optional if userId provided)
 * @param {number|string} [params.page=1] - 1-indexed page number
 * @param {number|string} [params.limit=10] - Items per page (0 returns all)
 * @param {string} [params.category=''] - Category slug or name filter
 * @param {string} [params.search=''] - Keyword search (title, address, city)
 * @param {boolean|string|null} [params.isActive=null] - Status filter (true, false, or null for all)
 * @param {string} [params.sort=''] - Sort key ('price_asc' | 'price_desc' | 'oldest' | default)
 *
 * @returns {Promise<{
 *   catalogId: string|null,
 *   vendorId: string|null,
 *   items: Array<Object>,
 *   itemsByCategory: Object<string, Array<Object>>,
 *   pagination: { total: number, page: number, limit: number, totalPages: number }
 * }>}
 */
export async function getVendorPackages(userId, page = 1, limit = 10, minPrice = 500, maxPrice = 5000, format = 'flat', sort = 'price_asc', q = '', latitude = 30.0869, longitude = 78.2676, radius = 30, address = 'Manali', category = 'homestay') {

    const vendor = await getBusinessByUserId(userId, 'category');
    if (!vendor) return [];

    const vendorId = vendor._id.toString();

    const vendorCategories = (vendor?.category || []).map(({ name, slug, _id }) => ({ name, slug, id: _id.toString() }));
    const catalog = await getPackageBy({ user: userId, vendor: vendorId });
    if (!catalog) return [];

    let result = [];
    for (const { name, slug, id } of vendorCategories) {
        const key = name === 'Bike/Scooter Rental' ? 'vehicleRental' : name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join('');
        const items = Array.isArray(catalog[key]) ? catalog[key] : [];
        result = result.concat(items.map(item => ({
            id: item._id,
            title: item.title || item.name || '',
            isActive: item.isActive,
            pricing: {
                basePrice: item.pricing?.basePrice || 0,
                gst: item.pricing?.gst || 18,
                sellingPrice: item.pricing?.sellingPrice || 0,
            },
            address: item?.location?.address || '',
            location: getLocationPoint(item?.location),
            photos: typeof item.photos?.[0] === 'string' ? item.photos[0] : (item.photos?.[0]?.url || ''),
            category_name: name,
            category_id: id,
            rating: {
                average: item.reviews?.average || 0,
                count: item.reviews?.count || 0
            }
        })));
    }

    return result;
}

export default getVendorPackages;
