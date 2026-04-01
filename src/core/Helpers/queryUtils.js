/**
 * Utility functions for building database and API queries.
 */

/**
 * Extracts standard pagination variables from a Next.js Request object.
 * @param {Request} req 
 * @param {number} defaultLimit 
 * @param {number} defaultPage 
 * @returns {Object} { page, limit, skip }
 */
export const buildPaginationQuery = (req, defaultLimit = 10, defaultPage = 1) => {
    let page = defaultPage;
    let limit = defaultLimit;

    if (req && req.url) {
        try {
            const url = new URL(req.url, `http://${req.headers?.get('host') || 'localhost'}`);
            if (url.searchParams.has('page')) page = parseInt(url.searchParams.get('page')) || defaultPage;
            if (url.searchParams.has('limit')) limit = parseInt(url.searchParams.get('limit')) || defaultLimit;
        } catch (error) {
        }
    }

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Paginates an array and returns the slice + descriptive pagination metadata.
 * @param {Array} items - Full list of items to paginate
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page (0 for all)
 * @returns {Object} { items, pagination }
 */
export const paginateArray = (items, page, limit) => {
    const total = items.length;
    const skip = (page - 1) * limit;

    const paginatedItems = limit > 0 ? items.slice(skip, skip + limit) : items;

    return {
        items: paginatedItems,
        pagination: {
            total,
            page,
            limit: limit === 0 ? total : limit,
            totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
        }
    };
};
