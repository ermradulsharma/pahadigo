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
            console.error("Query string parse error:", error);
        }
    }

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};
