import { HTTP_STATUS } from '../constants/index.js';

/**
 * Send a success response (2xx)
 * @param {number} [status=HTTP_STATUS.OK] - Status code (if data is provided as 2nd arg)
 * @param {string} message - Success message
 * @param {object} [data={}] - Additional success data
 */
function successResponse(status = HTTP_STATUS.OK, message = "Success", data = {}) {
    return new Response(JSON.stringify({ success: true, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Send an error response (4xx, 5xx)
 * @param {number} [status=HTTP_STATUS.BAD_REQUEST] - HTTP Status Code
 * @param {string} message - Error message
 * @param {object} [data={}] - Additional error data
 */
function errorResponse(status = HTTP_STATUS.BAD_REQUEST, message = "Error", data = {}) {
    return new Response(JSON.stringify({ success: false, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export { successResponse, errorResponse };
