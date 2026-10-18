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

/**
 * Send a standardized paginated response (success: true, message, data, pagination)
 * @param {number} [status=HTTP_STATUS.OK] - Status code
 * @param {string} message - Success message
 * @param {Array|object} data - Data items
 * @param {object} pagination - Pagination metadata { total, page, limit, totalPages }
 * @param {object} [headers={}] - Custom headers
 */
function paginatedResponse(status = HTTP_STATUS.OK, message = "Success", data = [], pagination = {}, headers = {}) {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const total = pagination.total ?? 0;
  const totalPages = pagination.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 0);

  return new Response(JSON.stringify({
    success: DEFAULTS.TRUE,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  }), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

export { successResponse, errorResponse, paginatedResponse };
export default { successResponse, errorResponse, paginatedResponse };
