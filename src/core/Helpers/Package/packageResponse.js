import { getLocationPoint } from '@/core/Helpers/addressHelper.js';

export function packageItemResponse(item, categoryInfo = {}, reviewStats = null, extraFields = {}) {
    if (!item) return null;

    const itemId = (item._id || item.id)?.toString() || '';
    const categoryName = categoryInfo?.name || categoryInfo?.category_name || item.category_name || '';
    const categorySlug = categoryInfo?.slug || categoryInfo?.category_slug || item.category_slug || '';
    const categoryId = categoryInfo?.id || categoryInfo?._id || categoryInfo?.category_id || item.category_id || '';

    // Calculate rating stats
    let average = 0;
    let count = 0;

    const stats = reviewStats || item?.rating || item?.reviews || item?.reviewStats;

    if (stats instanceof Map) {
        const stat = stats.get(itemId);
        if (stat) {
            count = stat.count || 0;
            average = count > 0 ? Math.round((stat.sum / count) * 10) / 10 : 0;
        }
    } else if (Array.isArray(stats) && stats.length > 0) {
        average = stats[0]?.average ? Math.round(Number(stats[0].average) * 10) / 10 : 0;
        count = Number(stats[0]?.count) || 0;
    } else if (stats && typeof stats === 'object') {
        average = stats.average ? Math.round(Number(stats.average) * 10) / 10 : 0;
        count = Number(stats.count) || 0;
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
            gst: item.pricing?.gst !== undefined ? item.pricing.gst : 18,
            sellingPrice: item.pricing?.sellingPrice || 0,
        },
        address: item?.location?.address || item?.address || '',
        location: coords,
        photos,
        category_name: categoryName,
        category_slug: categorySlug,
        category_id: categoryId ? categoryId.toString() : '',
        rating: {
            average,
            count
        },
        ...(extraFields.wishlist !== undefined ? { wishlist: Boolean(extraFields.wishlist) } : {})
    };
}

export default {
    packageItemResponse
};