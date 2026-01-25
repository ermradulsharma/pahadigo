import { successResponse, errorResponse } from '../helpers/response.js';

export function apiHandler(handler) {
    return async (req, params) => {
        try {
            return await handler(req, params);
        } catch (err) {
            return errorResponse(500, err.message || 'Internal Server Error', {});
        }
    };
}
