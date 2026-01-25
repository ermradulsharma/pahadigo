/**
 * Send a success response (2xx)
 * @param {number} [status=200] - Status code (if data is provided as 2nd arg)
 * @param {string} message - Success message
 * @param {object} [data={}] - Additional success data
 */
function successResponse(status = 200, message = "Success", data = {}) {
    return new Response(JSON.stringify({ success: true, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Send an error response (4xx, 5xx)
 * @param {number} [status=400] - HTTP Status Code
 * @param {string} message - Error message
 * @param {object} [data={}] - Additional error data
 */
function errorResponse(status = 400, message = "Error", data = {}) {
    return new Response(JSON.stringify({ success: false, message, data }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export { successResponse, errorResponse };
