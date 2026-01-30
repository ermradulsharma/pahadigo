import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

export function apiHandler(handler) {
    return async (req, params) => {
        try {
            return await handler(req, params);
        } catch (err) {
            if (!handler) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.ROUTE_NOT_FOUND, {});
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    };
}
