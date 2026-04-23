import { HTTP_STATUS, DEFAULTS } from '@/core/Constants/index.js';

/**
 * Send a success response (2xx)
 * @param {number} [status=HTTP_STATUS.OK] - Status code
 * @param {string} message - Success message
 * @param {object} [data={}] - Additional success data
 * @param {object} [headers={}] - Custom headers
 */
function successResponse(status = HTTP_STATUS.OK, message = "Success", data = {}, headers = {}) {
  return new Response(JSON.stringify({ success: DEFAULTS.TRUE, message, data }), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

/**
 * Send an error response (4xx, 5xx)
 * @param {number} [status=HTTP_STATUS.BAD_REQUEST] - HTTP Status Code
 * @param {string} message - Error message
 * @param {object} [data={}] - Additional error data
 * @param {object} [headers={}] - Custom headers
 */
function errorResponse(status = HTTP_STATUS.BAD_REQUEST, message = "Error", data = {}, headers = {}) {
  return new Response(JSON.stringify({ success: DEFAULTS.FALSE, message, data }), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export { successResponse, errorResponse };
export default { successResponse, errorResponse };
