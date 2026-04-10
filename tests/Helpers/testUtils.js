import mongoose from 'mongoose';

/**
 * Generate a new Mongoose ObjectId for test data.
 */
export const generateId = () => new mongoose.Types.ObjectId();

/**
 * Clean all collections in the in-memory test database.
 * Can be called explicitly within a test for granular control,
 * in addition to the global afterEach in tests/setup.js.
 */
export const cleanDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
};

/**
 * Build a mock Next.js App Router Request object for controller unit tests.
 * @param {Object} options
 * @param {Object} options.jsonBody - Pre-parsed JSON body
 * @param {Object} options.formDataBody - Pre-parsed FormData body  
 * @param {Object} options.params - URL path parameters
 * @param {Object} options.headers - HTTP headers as plain object
 * @param {Object} options.user - Authenticated user attached to request
 * @param {string} options.url - Request URL
 * @returns {Object} Mock request object compatible with controllers
 */
export const createMockReq = ({
    jsonBody = null,
    formDataBody = null,
    params = {},
    headers = {},
    user = null,
    url = 'http://localhost/api/test'
} = {}) => {
    const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));

    return {
        jsonBody,
        formDataBody,
        params,
        user,
        url,
        headers: {
            get: (name) => headerMap.get(name.toLowerCase()) ?? null,
        },
        nextUrl: {
            searchParams: new URLSearchParams(new URL(url).search)
        }
    };
};
