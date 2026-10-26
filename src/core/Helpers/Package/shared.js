export function schemaKey(name) {
    return name === 'Bike/Scooter Rental' ? 'vehicleRental' : name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map((word, index) => (index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join('');
}

export function paginateItems(items = [], options = {}) {
    const { sort = '', page = 1, limit = 10 } = options;

    if (sort === 'price_asc') {
        items.sort((a, b) => (a.pricing?.sellingPrice || 0) - (b.pricing?.sellingPrice || 0));
    } else if (sort === 'price_desc') {
        items.sort((a, b) => (b.pricing?.sellingPrice || 0) - (a.pricing?.sellingPrice || 0));
    } else if (sort === 'oldest') {
        items.sort((a, b) => (a.id || '').toString().localeCompare((b.id || '').toString()));
    } else if (sort === 'rating_desc' || sort === 'top_rated') {
        items.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    } else {
        items.sort((a, b) => (b.id || '').toString().localeCompare((a.id || '').toString()));
    }

    const total = items.length;
    const totalPages = limit > 0 ? (Math.ceil(total / limit) || 0) : 1;

    const skip = (page - 1) * (limit || total);
    const take = limit > 0 ? limit : total;

    const paginated = items.slice(skip, skip + take);

    return {
        items: paginated,
        pagination: {
            total,
            page,
            limit,
            totalPages
        }
    };
}

export function buildEmptyResult(isFlat = false, options = {}) {
    const result = isFlat ? paginateItems([], options) : {};
    return result;
}

export default { schemaKey, paginateItems, buildEmptyResult };


