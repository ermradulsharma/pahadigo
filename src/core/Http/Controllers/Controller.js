import { successResponse, errorResponse } from '@/core/Helpers/response.js';

/**
 * Base Controller class for providing standardized response methods
 * to all extending controllers in the system.
 */
class Controller {
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
