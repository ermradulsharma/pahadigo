import { successResponse, errorResponse } from '@/helpers/response.js';

/**
 * Base Controller class that all controllers should extend.
 * Provides shared helper methods for standardized responses.
 */
export default class Controller {
    /**
     * Send a standardized success response.
     */
    success(status, message, data = {}) {
        return successResponse(status, message, data);
    }

    /**
     * Send a standardized error response.
     */
    error(status, message, data = {}) {
        return errorResponse(status, message, data);
    }
}
