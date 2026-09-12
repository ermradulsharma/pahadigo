/**
 * Utility functions for building database and API queries.
 */

/**
 * Extracts standard pagination variables from a Next.js Request object, URL, or query object.
 * @param {Request|string|Object} req - Next.js Request object, URL string, or request query object
 * @param {number} defaultLimit - Default items per page
 * @param {number} defaultPage - Default initial page
 * @returns {Object} { page, limit, skip }
 */
export const buildPaginationQuery = (req, defaultLimit = 10, defaultPage = 1) => {
    let page = defaultPage;
    let limit = defaultLimit;

    if (req) {
        try {
            if (typeof req === 'string') {
                const url = new URL(req, 'http://localhost:3000');
                if (url.searchParams.has('page')) page = parseInt(url.searchParams.get('page'), 10) || defaultPage;
                if (url.searchParams.has('limit')) limit = parseInt(url.searchParams.get('limit'), 10) || defaultLimit;
            } else if (req.url) {
                const urlStr = req.url.startsWith('http') ? req.url : `http://${req.headers?.get?.('host') || 'localhost:3000'}${req.url.startsWith('/') ? '' : '/'}${req.url}`;
                const url = new URL(urlStr);
                if (url.searchParams.has('page')) page = parseInt(url.searchParams.get('page'), 10) || defaultPage;
                if (url.searchParams.has('limit')) limit = parseInt(url.searchParams.get('limit'), 10) || defaultLimit;
            } else if (req.query && typeof req.query === 'object') {
                if (req.query.page) page = parseInt(req.query.page, 10) || defaultPage;
                if (req.query.limit) limit = parseInt(req.query.limit, 10) || defaultLimit;
            }
        } catch (error) {
            // Fallback to defaults on malformed URL/query parsing
        }
    }

    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Paginates an array and returns the slice + descriptive pagination metadata.
 * @param {Array} items - Full list of items to paginate
 * @param {number|string} page - Current page number
 * @param {number|string} limit - Number of items per page (0 for all)
 * @returns {Object} { items, pagination: { total, page, limit, totalPages } }
 */
export const paginateArray = (items = [], page = 1, limit = 10) => {
    const list = Array.isArray(items) ? items : [];
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(0, parseInt(limit, 10) || 0);

    const total = list.length;
    const skip = (pageNum - 1) * (limitNum || total);

    const paginatedItems = limitNum > 0 ? list.slice(skip, skip + limitNum) : list;
    const totalPages = limitNum > 0 ? (Math.ceil(total / limitNum) || 0) : 1;

    return {
        items: paginatedItems,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum === 0 ? total : limitNum,
            totalPages
        }
    };
};

export default { buildPaginationQuery, paginateArray };

