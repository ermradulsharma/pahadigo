import mongoose from 'mongoose';

/**
 * Generate a new Mongoose ObjectId for test data.
 */
export const generateId = () => new mongoose.Types.ObjectId();

/**
 * Clean database between tests.
 * Note: tests/setup.js runs afterEach to wipe all collections globally.
 * This helper is a compatibility shim for tests that manually call cleanDatabase().
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
 * Build a mock Next.js Request object for controller unit tests.
 * @param {Object} options
 * @param {Object} options.jsonBody - Pre-parsed JSON body
 * @param {Object} options.formDataBody - Pre-parsed FormData body
 * @param {Object} options.params - URL path parameters
 * @param {Object} options.headers - HTTP headers
 * @param {Object} options.user - Authenticated user attached to request
 * @param {string} options.url - Request URL
 * @returns {Object} Mock request object
 */
export const createMockReq = ({
    jsonBody = null,
    formDataBody = null,
    params = {},
    headers = {},
    user = null,
    url = 'http://localhost/api/test'
} = {}) => {
    const headerMap = new Map(Object.entries(headers));

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
