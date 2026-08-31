import { successResponse, errorResponse } from '@/core/Helpers/response.js';

/**
 * Base Controller class for providing standardized response methods
 * to all extending controllers in the system.
 */
class Controller {
    /**
     * Validates that the request has an authenticated user context
     * @param {Object} req - The HTTP Request object
     * @returns {String|null} User ID if authenticated, null otherwise
     */
    ensureAuth(req) {
        if (!req || !req.user || !req.user.id) return null;
        return req.user.id;
    }

    /**
     * Send a standardized success response
     */
    success(status, message, data = null) {
        return successResponse(status, message, data);
    }

    /**
     * Send a standardized error response
     */
    error(status, message, errors = null) {
        return errorResponse(status, message, errors);
    }
}

export default Controller;
